/**
 * Cloud Functions — Provisión de cuentas Microsoft 365 (Fase 2)
 *
 * Expone un callable `provisionM365User` que:
 *  1. Verifica que quien llama es un admin institucional autenticado (Firebase Auth).
 *  2. Lee la admisión aprobada en Firestore (correo/contraseña/nombre ya generados en Fase 1).
 *  3. Crea la cuenta real en Microsoft 365 vía Microsoft Graph (auth app-only con client secret).
 *  4. (Opcional) Asigna una licencia para habilitar Teams.
 *  5. Actualiza la admisión con el resultado de la provisión.
 *
 * Los 3 valores de Azure se guardan como SECRETOS (no en el código):
 *   firebase functions:secrets:set AZURE_TENANT_ID
 *   firebase functions:secrets:set AZURE_CLIENT_ID
 *   firebase functions:secrets:set AZURE_CLIENT_SECRET
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { ClientSecretCredential } from "@azure/identity";

admin.initializeApp();

// Secretos de Azure AD (App Registration)
const AZURE_TENANT_ID = defineSecret("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = defineSecret("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = defineSecret("AZURE_CLIENT_SECRET");

// Parámetros no sensibles (con default). El SKU de licencia es opcional: si se deja
// vacío no se asigna licencia (la cuenta se crea, pero Teams requiere licencia).
const AZURE_LICENSE_SKU = defineString("AZURE_LICENSE_SKU", { default: "" });
const GRAPH = "https://graph.microsoft.com/v1.0";

/** Obtiene un token de aplicación para Microsoft Graph. */
async function getGraphToken(): Promise<string> {
  const credential = new ClientSecretCredential(
    AZURE_TENANT_ID.value(),
    AZURE_CLIENT_ID.value(),
    AZURE_CLIENT_SECRET.value()
  );
  const token = await credential.getToken("https://graph.microsoft.com/.default");
  if (!token?.token) {
    throw new HttpsError("internal", "No se pudo obtener token de Microsoft Graph.");
  }
  return token.token;
}

/** Extrae el mensaje de error legible de una respuesta de Graph (sin lanzar). */
async function graphMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) return body.error.message;
  } catch {
    // sin cuerpo JSON
  }
  return res.statusText;
}

/** Lanza HttpsError legible a partir de una respuesta de error de Graph. */
async function graphError(res: Response, contexto: string): Promise<never> {
  const detalle = await graphMessage(res);
  throw new HttpsError("internal", `${contexto}: ${detalle}`);
}

export const provisionM365User = onCall(
  {
    secrets: [AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET],
    region: "us-central1",
  },
  async (request) => {
    // 1. Autorización: debe ser un usuario autenticado. En esta app, solo los
    //    administradores usan Firebase Auth (los aspirantes usan códigos de acceso).
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión como administrador.");
    }

    // 2. Leer la admisión.
    const admissionId = (request.data?.admissionId as string | undefined)?.trim();
    if (!admissionId) {
      throw new HttpsError("invalid-argument", "Falta el admissionId.");
    }

    const ref = admin.firestore().doc(`admissions/${admissionId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Admisión no encontrada.");
    }
    const adm = snap.data() as any;
    const creds = adm.assignedCredentials || {};
    const email: string = creds.microsoftEmail;
    const password: string = creds.microsoftPassword;
    const firstName: string = adm.studentFirstName || "";
    const lastName: string = adm.studentLastName || "";

    if (!email || !password) {
      throw new HttpsError(
        "failed-precondition",
        "La admisión no tiene credenciales generadas (aprueba primero en Fase 1)."
      );
    }
    if (creds.provisioningStatus === "provisioned") {
      throw new HttpsError("already-exists", "Esta cuenta ya fue provisionada.");
    }

    try {
      const token = await getGraphToken();
      const authHeader = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      // 3. Crear el usuario en Microsoft 365 (idempotente: si ya existe, lo reutiliza).
      const mailNickname = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      let microsoftUserId: string;

      const createRes = await fetch(`${GRAPH}/users`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          accountEnabled: true,
          displayName: `${firstName} ${lastName}`.trim(),
          mailNickname,
          userPrincipalName: email,
          usageLocation: "SV",
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password,
          },
        }),
      });

      if (createRes.ok) {
        microsoftUserId = ((await createRes.json()) as { id: string }).id;
      } else {
        // Si el usuario ya existe (reintento), lo recuperamos por su UPN y seguimos.
        const getRes = await fetch(`${GRAPH}/users/${encodeURIComponent(email)}`, {
          method: "GET",
          headers: authHeader,
        });
        if (getRes.ok) {
          microsoftUserId = ((await getRes.json()) as { id: string }).id;
        } else {
          await graphError(createRes, "Error al crear la cuenta en Microsoft 365");
        }
      }

      // La cuenta ya existe en Microsoft: marcamos como provisionada de inmediato.
      await ref.update({
        "assignedCredentials.provisioningStatus": "provisioned",
        "assignedCredentials.microsoftUserId": microsoftUserId!,
        "assignedCredentials.provisioningError": admin.firestore.FieldValue.delete(),
      });

      // 4. (Opcional) Asignar licencia para habilitar Teams. Un fallo aquí NO revierte
      //    la cuenta: queda provisionada, solo sin licencia, con una advertencia.
      let teamsEnabled = false;
      let licenseWarning: string | null = null;
      const skuId = AZURE_LICENSE_SKU.value().trim();
      if (skuId) {
        const licRes = await fetch(`${GRAPH}/users/${microsoftUserId!}/assignLicense`, {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify({ addLicenses: [{ skuId, disabledPlans: [] }], removeLicenses: [] }),
        });
        if (licRes.ok) {
          teamsEnabled = true;
        } else {
          licenseWarning = await graphMessage(licRes);
        }
      }

      await ref.update({
        "assignedCredentials.teamsEnabled": teamsEnabled,
        "assignedCredentials.provisioningError": licenseWarning || admin.firestore.FieldValue.delete(),
      });

      return { ok: true, microsoftUserId: microsoftUserId!, userPrincipalName: email, teamsEnabled, licenseWarning };
    } catch (err: any) {
      // Registrar el fallo en la admisión para trazabilidad.
      await ref
        .update({
          "assignedCredentials.provisioningStatus": "failed",
          "assignedCredentials.provisioningError": err?.message || String(err),
        })
        .catch(() => undefined);

      if (err instanceof HttpsError) throw err;
      throw new HttpsError("internal", err?.message || "Error inesperado en la provisión.");
    }
  }
);
