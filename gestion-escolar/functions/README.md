# Provisión Microsoft 365 (Fase 2)

Cloud Function `provisionM365User` que crea cuentas reales en Microsoft 365 vía Microsoft Graph.

## Requisitos previos

1. **Plan Blaze** en Firebase (Functions necesita salida a internet). Actívalo en la consola de Firebase.
2. **App Registration en Azure AD** con:
   - Permiso de **aplicación** `User.ReadWrite.All` (para crear cuentas).
   - **Admin consent concedido** (botón "Grant admin consent").
   - Un **client secret** creado (guarda el *Value*).
3. Node 20 y Firebase CLI (`npm i -g firebase-tools`, `firebase login`).

## Despliegue

Desde la **raíz del proyecto** (no dentro de `functions/`):

```bash
# 1. Instalar dependencias del backend
cd functions && npm install && cd ..

# 2. Guardar los 3 valores de Azure como secretos (te pedirá pegar cada valor)
firebase functions:secrets:set AZURE_TENANT_ID
firebase functions:secrets:set AZURE_CLIENT_ID
firebase functions:secrets:set AZURE_CLIENT_SECRET

# 3. Desplegar
firebase deploy --only functions
```

## Licencia para Teams (opcional)

Para que la cuenta tenga Teams se necesita asignarle una licencia (ej: "Microsoft 365 A1 for students", gratuita).
Consigue el **SKU GUID** en el M365 Admin Center → Facturación → Licencias, o vía Graph `GET /subscribedSkus`.

Crea el archivo `functions/.env` con:

```
AZURE_LICENSE_SKU=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Opcional: dominio de los admins que pueden provisionar (default salesianosanjose.edu.sv)
ADMIN_EMAIL_DOMAIN=salesianosanjose.edu.sv
```

Si dejas `AZURE_LICENSE_SKU` vacío, la cuenta se crea pero **sin licencia** (Teams no queda activo).

## Seguridad

El callable solo acepta llamadas de usuarios **autenticados en Firebase Auth** cuyo correo termine en
`@salesianosanjose.edu.sv` (los admins). Los secretos de Azure viven en Secret Manager, nunca en el frontend.
