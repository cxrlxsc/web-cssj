// src/auth/adminAuth.ts
// Lógica central de autenticación y roles del panel administrativo.
//
// Roles:
//   - 'admin'      → acceso a todo, incluyendo Recursos Internos (datos sensibles).
//   - 'editor_web' → solo puede modificar la Página Web (contenido público).
//
// El rol de cada cuenta se guarda en Firestore, colección 'usuarios_admin',
// con el correo (en minúsculas) como ID del documento: { rol: 'admin' | 'editor_web' }.
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export type RolAdmin = 'admin' | 'editor_web';

// Correos que SIEMPRE tienen rol admin. Es un respaldo para no quedar
// bloqueado si la colección 'usuarios_admin' está vacía.
//  Escribe aquí el correo del directivo/administrador principal.
export const ADMINS_BOOTSTRAP: string[] = [
   'soporte.it@salesianosanjose.edu.sv',
   'soporte.auxiliar@salesianosanjose.edu.sv',
   'admin@sanjose.edu.sv'
];

// Cuánto dura desbloqueado el área de Recursos tras re-autenticar (minutos).
const MINUTOS_CANDADO = 30;
const CLAVE_CANDADO = 'recursos_desbloqueado_hasta';

/**
 * Devuelve el rol de una cuenta a partir de su correo.
 * Si no hay documento configurado, asume 'editor_web' (acceso mínimo: solo web),
 * de modo que las áreas sensibles quedan cerradas por defecto.
 */
export async function obtenerRol(email: string | null | undefined): Promise<RolAdmin> {
  const correo = (email || '').toLowerCase().trim();
  if (!correo) return 'editor_web';
  if (ADMINS_BOOTSTRAP.map((c) => c.toLowerCase()).includes(correo)) return 'admin';

  try {
    const snap = await getDoc(doc(db, 'usuarios_admin', correo));
    if (snap.exists()) {
      const rol = snap.data().rol;
      if (rol === 'admin' || rol === 'editor_web') return rol;
    }
  } catch {
    // Si falla la lectura, caemos al acceso mínimo por seguridad.
  }
  return 'editor_web';
}

/** ¿El rol del usuario cumple con el rol requerido por una ruta? */
export function puedeAcceder(rol: RolAdmin | null, rolRequerido?: RolAdmin): boolean {
  if (!rolRequerido) return true;   // ruta abierta a cualquier cuenta autenticada
  if (rol === 'admin') return true; // el admin entra a todo
  return rol === rolRequerido;
}

/** Cierra la sesión de Firebase de verdad y limpia el candado. */
export async function cerrarSesionAdmin(): Promise<void> {
  sessionStorage.removeItem(CLAVE_CANDADO);
  try {
    await signOut(auth);
  } catch {
    // Ignoramos: aunque falle, redirigimos al login igualmente.
  }
}

// ===== Candado de re-autenticación para Recursos Internos =====

/** ¿El candado de Recursos sigue vigente en esta pestaña? */
export function candadoVigente(): boolean {
  const hasta = Number(sessionStorage.getItem(CLAVE_CANDADO) || 0);
  return Date.now() < hasta;
}

/** Marca Recursos como desbloqueado por los próximos MINUTOS_CANDADO. */
export function activarCandado(): void {
  sessionStorage.setItem(CLAVE_CANDADO, String(Date.now() + MINUTOS_CANDADO * 60 * 1000));
}

/**
 * Re-confirma la contraseña del usuario ya logueado. Si es correcta,
 * desbloquea Recursos. Lanza error si es incorrecta o no hay sesión.
 */
export async function reautenticarParaRecursos(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('No hay una sesión activa.');
  const credencial = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credencial);
  activarCandado();
}
