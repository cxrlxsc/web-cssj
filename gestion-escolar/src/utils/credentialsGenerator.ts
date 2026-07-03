// src/utils/credentialsGenerator.ts
// Generación de credenciales institucionales para aspirantes aprobados.
//
// - Correo:      nombre.apellido<añoIngreso>@salesianosanjose.edu.sv  (ej: carlos.castaneda2026@...)
// - Contraseña:  patrón derivado del carnet -> Csj<carnet>!            (ej: Csj20250103!)
// - Carnet:      se genera aparte (admissionService.generateStudentCarnet), formato AÑOGRADOORDEN

export const INSTITUTIONAL_DOMAIN = 'salesianosanjose.edu.sv';

/** Quita acentos, pasa a minúsculas y deja solo letras/números. */
function normalizeToken(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos / diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');      // solo alfanumérico
}

/** Toma el primer "token" (palabra) de un nombre compuesto ya normalizado. */
function firstToken(fullName: string): string {
  const first = (fullName || '').trim().split(/\s+/)[0] || '';
  return normalizeToken(first);
}

/**
 * Construye el correo institucional base (sin verificar unicidad).
 * La unicidad se resuelve en el servicio con buildUniqueEmail().
 */
export function buildInstitutionalEmail(
  studentFirstName: string,
  studentLastName: string,
  añoIngreso: number
): string {
  const nombre = firstToken(studentFirstName) || 'alumno';
  const apellido = firstToken(studentLastName) || 'cssj';
  return `${nombre}.${apellido}${añoIngreso}@${INSTITUTIONAL_DOMAIN}`;
}

/**
 * Dado un correo base y una lista de correos ya usados, devuelve uno único.
 * Si "carlos.castaneda2026@..." ya existe, prueba "carlos.castaneda2026.2@...", etc.
 */
export function buildUniqueEmail(baseEmail: string, existingEmails: string[]): string {
  const used = new Set(existingEmails.map(e => e.toLowerCase()));
  if (!used.has(baseEmail.toLowerCase())) return baseEmail;

  const [localPart, domain] = baseEmail.split('@');
  let n = 2;
  let candidate = `${localPart}.${n}@${domain}`;
  while (used.has(candidate.toLowerCase())) {
    n += 1;
    candidate = `${localPart}.${n}@${domain}`;
  }
  return candidate;
}

/**
 * Contraseña inicial temporal derivada del carnet: Cssj<carnet>!  (ej: Cssj20261101!)
 * "Cssj" = Colegio Salesiano San José. Cumple complejidad (mayúscula, minúsculas,
 * dígitos, símbolo, >= 8). El alumno debe cambiarla en el primer inicio de sesión.
 */
export function buildTempPassword(carnet: string): string {
  const soloDigitos = (carnet || '').replace(/\D/g, '') || '00000000';
  return `Cssj${soloDigitos}!`;
}
