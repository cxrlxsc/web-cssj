// src/services/configService.ts
// CONFIGURACIÓN DEL CICLO ESCOLAR (documento configuracion/matricula en Firestore).
//
// Aquí vive el año de matrícula activo (2026, 2027, ...) y los montos/fechas del
// proceso. Cada nuevo ciclo, el admin solo actualiza estos valores desde
// Colecturía y Aranceles (/admin/colecturia, pestañas "Ciclo Escolar" y
// "Precios y Cuotas por Grado") y TODO el sistema (reingreso, admisiones,
// talonarios, contratos, cálculo de grados) se ajusta solo — sin tocar código.
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ArancelGrado {
  cuotaMatricula: number;    // Matrícula del grado (monto del talonario NPE)
  cuotaMensualidad: number;  // Colegiatura mensual del grado (usada en el contrato)
}

export interface ConfigMatricula {
  anioMatricula: number;     // Año lectivo que se está matriculando (ej: 2027)
  fechaLimitePago: string;   // 'YYYY-MM-DD' — vencimiento del talonario de matrícula
  cuotaMatricula: number;    // Cuota de matrícula POR DEFECTO (si el grado no tiene arancel propio)
  cuotaMensualidad: number;  // Mensualidad POR DEFECTO (si el grado no tiene arancel propio)
  arancelesPorGrado?: Record<string, ArancelGrado>; // Cuotas específicas por grado (clave = nombre canónico)
  updatedAt?: Date;
  updatedBy?: string;
}

/** Grados oficiales del colegio para la tabla de aranceles (mismo catálogo de carnets). */
export const GRADOS_ARANCEL = [
  'Kinder 4', 'Kinder 5', 'Preparatoria',
  '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado',
  '7° Grado', '8° Grado', '9° Grado',
  '1° Bachillerato', '2° Bachillerato',
  '1° Diseño Gráfico', '2° Diseño Gráfico', '3° Diseño Gráfico',
  '1° Sistemas Eléctricos', '2° Sistemas Eléctricos', '3° Sistemas Eléctricos',
  '1° Desarrollo de Software', '2° Desarrollo de Software', '3° Desarrollo de Software',
] as const;

/**
 * Traduce cualquier variante del nombre de un grado ('5to Grado', 'QUINTO GRADO',
 * '1er Año Bachillerato'...) a su nombre canónico de la tabla de aranceles.
 */
export function gradoCanonico(grado: string | null | undefined): string | null {
  const g = (grado || '').toLowerCase().trim();
  if (!g) return null;

  const exacto = GRADOS_ARANCEL.find(nombre => nombre.toLowerCase() === g);
  if (exacto) return exacto;

  const num = parseInt((g.match(/\d+/) || ['0'])[0], 10);
  const ordinales: Record<string, number> = { 'primer': 1, 'segundo': 2, 'tercer': 3, 'cuarto': 4, 'quinto': 5, 'sexto': 6, 'septimo': 7, 'séptimo': 7, 'octavo': 8, 'noveno': 9 };
  const numOrdinal = Object.entries(ordinales).find(([palabra]) => g.includes(palabra))?.[1] || 0;
  const n = num || numOrdinal;

  if (g.includes('kinder')) return n === 5 ? 'Kinder 5' : 'Kinder 4';
  if (g.includes('prepa')) return 'Preparatoria';
  if (g.includes('software') || g.includes('desarrollo')) return `${n >= 1 && n <= 3 ? n : 1}° Desarrollo de Software`;
  if (g.includes('eléctric') || g.includes('electric')) return `${n >= 1 && n <= 3 ? n : 1}° Sistemas Eléctricos`;
  if (g.includes('diseño') || g.includes('diseno') || g.includes('gráfico') || g.includes('grafico')) return `${n >= 1 && n <= 3 ? n : 1}° Diseño Gráfico`;
  if (g.includes('bachillerato')) return n === 2 ? '2° Bachillerato' : '1° Bachillerato';
  if (g.includes('grado') && n >= 1 && n <= 9) return `${n}° Grado`;
  return null;
}

const DOC_PATH = { col: 'configuracion', id: 'matricula' } as const;

// Año mínimo de operación del sistema. Se creó para el ciclo 2027 en adelante
// (las matrículas de 2026 ya pasaron), así que nunca debe defaultear a algo menor.
const ANIO_MINIMO_MATRICULA = 2027;

/** Valores por defecto si el documento aún no existe (primer arranque). */
function defaults(): ConfigMatricula {
  const hoy = new Date();
  // La matrícula de un ciclo se trabaja el año anterior: de julio en adelante ya se
  // está matriculando el AÑO SIGUIENTE, para que el sistema no se quede en un ciclo
  // cuya matrícula ya cerró.
  const anioCalculado = hoy.getMonth() >= 6 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  const anio = Math.max(anioCalculado, ANIO_MINIMO_MATRICULA);
  return {
    anioMatricula: anio,
    fechaLimitePago: `${anio}-07-31`,
    cuotaMatricula: 145,
    cuotaMensualidad: 85,
  };
}

// Caché por sesión: la config se lee muchas veces (talonarios, headers, grados)
let cache: ConfigMatricula | null = null;
let cachePromise: Promise<ConfigMatricula> | null = null;

export const configService = {
  /** Obtiene la configuración del ciclo (con caché de sesión). */
  async getConfigMatricula(): Promise<ConfigMatricula> {
    if (cache) return cache;
    if (!cachePromise) {
      cachePromise = (async () => {
        try {
          const snap = await getDoc(doc(db, DOC_PATH.col, DOC_PATH.id));
          cache = snap.exists()
            ? { ...defaults(), ...(snap.data() as Partial<ConfigMatricula>) }
            : defaults();
        } catch {
          cache = defaults(); // sin conexión: valores razonables para no romper la UI
        }
        return cache;
      })();
    }
    return cachePromise;
  },

  /** Atajo: solo el año de matrícula activo. */
  async getAnioMatricula(): Promise<number> {
    return (await this.getConfigMatricula()).anioMatricula;
  },

  /**
   * Arancel (matrícula + mensualidad) que le corresponde a un grado.
   * Si el grado tiene cuota propia en 'arancelesPorGrado' se usa esa;
   * si no, se usan las cuotas por defecto de la configuración.
   */
  async getArancelParaGrado(grado: string | null | undefined): Promise<ArancelGrado> {
    const config = await this.getConfigMatricula();
    const canonico = gradoCanonico(grado);
    const propio = canonico ? config.arancelesPorGrado?.[canonico] : undefined;
    return {
      cuotaMatricula: propio?.cuotaMatricula ?? config.cuotaMatricula,
      cuotaMensualidad: propio?.cuotaMensualidad ?? config.cuotaMensualidad,
    };
  },

  /** Guarda la configuración (merge) e invalida la caché. */
  async saveConfigMatricula(cambios: Partial<ConfigMatricula>, updatedBy?: string): Promise<void> {
    await setDoc(
      doc(db, DOC_PATH.col, DOC_PATH.id),
      { ...cambios, updatedAt: Timestamp.fromDate(new Date()), updatedBy: updatedBy || 'admin' },
      { merge: true }
    );
    cache = null;
    cachePromise = null;
  },
};
