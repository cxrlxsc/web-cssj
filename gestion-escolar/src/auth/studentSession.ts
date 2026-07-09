// src/auth/studentSession.ts
// Sesión del alumno de REINGRESO. El PIN se valida en el servidor (Cloud Function
// loginReingreso) y nunca viaja al navegador. El alumno recibe un token de Firebase
// con uid = carnet; con él solo puede leer/editar SU propio documento en 'alumnos'.
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, functions } from '../firebase/config';

const CLAVE_SESION = 'studentSession';

/**
 * Valida carnet + PIN en el servidor e inicia sesión de estudiante.
 * Devuelve true si las credenciales son correctas; false si no lo son.
 * Lanza error solo ante fallos de red/servidor (no de credenciales).
 */
export async function iniciarSesionEstudiante(carnet: string, pin: string): Promise<boolean> {
  const fn = httpsCallable<{ carnet: string; pin: string }, { token: string }>(functions, 'loginReingreso');
  try {
    const res = await fn({ carnet: carnet.trim(), pin: pin.trim() });
    await signInWithCustomToken(auth, res.data.token);
    localStorage.setItem(CLAVE_SESION, carnet.trim());
    return true;
  } catch (e: any) {
    const code: string = e?.code || '';
    // Credenciales incorrectas / faltantes -> false (no es un error de sistema)
    if (code.includes('permission-denied') || code.includes('invalid-argument') || code.includes('not-found')) {
      return false;
    }
    throw e; // fallo real de red o servidor
  }
}

/**
 * Devuelve el carnet del alumno autenticado, esperando a que Firebase restaure
 * la sesión (evita leer 'alumnos' antes de que la sesión esté lista). null si no hay sesión.
 */
export function obtenerSesionEstudiante(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user?.uid ?? null);
    });
  });
}

/** Cierra la sesión del alumno. */
export async function cerrarSesionEstudiante(): Promise<void> {
  localStorage.removeItem(CLAVE_SESION);
  try {
    await signOut(auth);
  } catch {
    // ignoramos: igual redirigimos al login
  }
}
