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
// Dominio institucional cuyos usuarios (Firebase Auth) pueden provisionar.
const ADMIN_EMAIL_DOMAIN = defineString("ADMIN_EMAIL_DOMAIN", {
  default: "salesianosanjose.edu.sv",
});

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

/** Lanza HttpsError legible a partir de una respuesta de error de Graph. */
async function graphError(res: Response, contexto: string): Promise<never> {
  let detalle = res.statusText;
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) detalle = body.error.message;
  } catch {
    // sin cuerpo JSON
  }
  throw new HttpsError("internal", `${contexto}: ${detalle}`);
}

export const provisionM365User = onCall(
  {
    secrets: [AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET],
    region: "us-central1",
  },
  async (request) => {
    // 1. Autorización: debe ser un admin institucional autenticado.
    const authEmail = request.auth?.token?.email as string | undefined;
    if (!request.auth || !authEmail) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión como administrador.");
    }
    if (!authEmail.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN.value().toLowerCase()}`)) {
      throw new HttpsError("permission-denied", "No autorizado para provisionar cuentas.");
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

      // 3. Crear el usuario en Microsoft 365.
      const mailNickname = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
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

      if (!createRes.ok) {
        await graphError(createRes, "Error al crear la cuenta en Microsoft 365");
      }
      const created = (await createRes.json()) as { id: string };
      const microsoftUserId = created.id;

      // 4. (Opcional) Asignar licencia para habilitar Teams.
      let teamsEnabled = false;
      const skuId = AZURE_LICENSE_SKU.value().trim();
      if (skuId) {
        const licRes = await fetch(`${GRAPH}/users/${microsoftUserId}/assignLicense`, {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify({ addLicenses: [{ skuId, disabledPlans: [] }], removeLicenses: [] }),
        });
        if (!licRes.ok) {
          // La cuenta ya existe; reportamos, pero no revertimos.
          await graphError(licRes, "Cuenta creada, pero falló la asignación de licencia");
        }
        teamsEnabled = true;
      }

      // 5. Guardar resultado en la admisión.
      await ref.update({
        "assignedCredentials.provisioningStatus": "provisioned",
        "assignedCredentials.microsoftUserId": microsoftUserId,
        "assignedCredentials.teamsEnabled": teamsEnabled,
        "assignedCredentials.provisioningError": admin.firestore.FieldValue.delete(),
      });

      return { ok: true, microsoftUserId, userPrincipalName: email, teamsEnabled };
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
