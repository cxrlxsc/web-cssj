// src/services/alumnoService.ts
// Alumnos de ANTIGUO INGRESO (reingreso) respaldados por Firebase.
//
// Colección Firestore: 'alumnos'  (ID del documento = carnet, igual que 'reingresoPayments')
//
// Flujo:
//   1. Los datos históricos vienen de la tabla [dbo].[alumno] de SQL Server (cssj_db).
//   2. Se pegan las filas exportadas en src/data/alumnosParaImportar.ts (forma AlumnoSqlRow).
//   3. Desde /admin/importar-alumnos se ejecuta importAlumnosDesdeSql() que los sube en lote.
//   4. El alumno inicia sesión en /reingreso/login con carnet + PIN (por defecto su NIE,
//      o los últimos 4 dígitos del carnet si no tiene NIE registrado).
import {
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AlumnoReingreso, AlumnoSqlRow, ContactoFamiliar } from '../types/reingreso';

const COLECCION_ALUMNOS = 'alumnos';

// ============================================
// GRADOS: código (id_grado de SQL) <-> nombre legible
// Mismos códigos que usa el NPE (src/utils/npeGenerator.ts)
// ============================================
const GRADO_NOMBRES: Record<string, string> = {
  '01': 'Kinder 4', '02': 'Kinder 5', '03': 'Preparatoria',
  '11': '1° Grado', '12': '2° Grado', '13': '3° Grado',
  '14': '4° Grado', '15': '5° Grado', '16': '6° Grado',
  '17': '7° Grado', '18': '8° Grado', '19': '9° Grado',
  '21': '1° Bachillerato', '22': '2° Bachillerato',
  '31': '1° Diseño Gráfico', '32': '2° Diseño Gráfico', '33': '3° Diseño Gráfico',
  '41': '1° Sistemas Eléctricos', '42': '2° Sistemas Eléctricos', '43': '3° Sistemas Eléctricos',
  '51': '1° Desarrollo de Software', '52': '2° Desarrollo de Software', '53': '3° Desarrollo de Software',
};

// Progresión de grados por código. 9° (19) avanza por defecto a Bachillerato General (21);
// si el alumno pasa a un técnico se corrige con el campo grado_actual al importar.
const SIGUIENTE_GRADO: Record<string, string> = {
  '01': '02', '02': '03', '03': '11',
  '11': '12', '12': '13', '13': '14', '14': '15', '15': '16', '16': '17',
  '17': '18', '18': '19', '19': '21',
  '21': '22',
  '31': '32', '32': '33',
  '41': '42', '42': '43',
  '51': '52', '52': '53',
};

/** Devuelve el código de grado a partir de un código ('12') o de un nombre ('2° Grado'). */
export function normalizarCodigoGrado(grado: string | null | undefined): string {
  const valor = (grado || '').trim();
  if (!valor) return '';
  // Ya es un código conocido (con o sin cero a la izquierda: '2' -> '02' no aplica, códigos son de 2 dígitos)
  const codigo = valor.padStart(2, '0');
  if (GRADO_NOMBRES[codigo]) return codigo;
  // Es un nombre: lo buscamos de forma tolerante
  const buscado = valor.toLowerCase();
  for (const [cod, nombre] of Object.entries(GRADO_NOMBRES)) {
    if (nombre.toLowerCase() === buscado) return cod;
  }
  for (const [cod, nombre] of Object.entries(GRADO_NOMBRES)) {
    if (buscado.includes(nombre.toLowerCase()) || nombre.toLowerCase().includes(buscado)) return cod;
  }
  return '';
}

/** Nombre legible de un grado a partir de código o nombre. */
export function nombreGrado(grado: string | null | undefined): string {
  const codigo = normalizarCodigoGrado(grado);
  return codigo ? GRADO_NOMBRES[codigo] : (grado || '').trim();
}

/** Calcula el grado al que debe matricularse (el siguiente al actual). */
export function calcularGradoMatricular(gradoActual: string | null | undefined): string {
  const codigo = normalizarCodigoGrado(gradoActual);
  if (!codigo) return 'No definido';
  const siguiente = SIGUIENTE_GRADO[codigo];
  return siguiente ? GRADO_NOMBRES[siguiente] : 'Graduado';
}

// ============================================
// MAPEO SQL -> FIRESTORE
// ============================================
const s = (v: string | number | null | undefined): string =>
  v === null || v === undefined || String(v).trim().toUpperCase() === 'NULL' ? '' : String(v).trim();

/** Normaliza la fecha de nacimiento a 'YYYY-MM-DD' (el input type="date" lo exige).
 *  SQL Server la guarda como varchar 'DD/MM/YYYY'. */
function normalizarFecha(fecha: string | null | undefined): string {
  const valor = s(fecha);
  if (!valor) return '';
  const ddmmyyyy = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dia, mes, anio] = ddmmyyyy;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  return valor; // ya viene en ISO u otro formato: se deja tal cual
}

/** La tabla nacionalidad usa códigos ('01' = salvadoreña). */
function nombreNacionalidad(codigo: string | null | undefined): string {
  const valor = s(codigo).toUpperCase();
  if (!valor || valor === '01' || valor === 'SV') return 'SALVADOREÑA';
  return valor; // otros códigos: se conserva el valor hasta tener el catálogo completo
}

/** PIN por defecto: el NIE del alumno; si no tiene, los últimos 4 dígitos del carnet. */
export function pinPorDefecto(row: Pick<AlumnoSqlRow, 'carnet' | 'nie' | 'pin'>): string {
  if (s(row.pin)) return s(row.pin);
  if (s(row.nie)) return s(row.nie);
  return s(row.carnet).slice(-4) || '0000';
}

function contacto(
  nombre?: string | null, profesion?: string | null, lugarTrabajo?: string | null,
  cargo?: string | null, telFijo?: string | null, telOficina?: string | null,
  telCelular?: string | null, correo?: string | null, religion?: string | null
): ContactoFamiliar {
  return {
    nombre: s(nombre),
    profesion: s(profesion),
    lugarTrabajo: s(lugarTrabajo),
    cargo: s(cargo),
    telefonoFijo: s(telFijo),
    telefonoTrabajo: s(telOficina),
    telefonoMovil: s(telCelular),
    email: s(correo),
    religion: s(religion),
  };
}

/** Convierte una fila de la tabla [dbo].[alumno] al documento de Firestore. */
export function mapSqlRowToAlumno(row: AlumnoSqlRow): AlumnoReingreso {
  const gradoActualRaw = s(row.grado_actual) || s(row.grado_ingreso);
  const gradoActual = nombreGrado(gradoActualRaw);
  const siNo = (v?: string | null) => (s(v).toUpperCase() === 'SI' ? 'SI' : 'NO');

  return {
    // Ingreso
    anioIngreso: s(row.anho_ingreso),
    gradoActual,
    gradoMatricular: calcularGradoMatricular(gradoActualRaw),

    // Acceso
    pin: pinPorDefecto(row),
    estado: s(row.estado).toUpperCase() || 'ACTIVO',

    // Alumno
    carnet: s(row.carnet),
    nie: s(row.nie),
    nombres: s(row.nombres),
    apellidos: s(row.apellidos),
    sexo: s(row.sexo).toUpperCase(),
    fechaNac: normalizarFecha(row.fecha_nac),
    nacionalidad: nombreNacionalidad(row.id_nacionalidad),
    zona: s(row.zona).toUpperCase(),
    departamento: s(row.id_departamento),   // código SQL; se muestra/edita como texto en el formulario
    municipio: s(row.id_municipio),         // código SQL; ídem
    telefono: s(row.telefono_fijo),
    direccion: s(row.direccion),
    viveCon: s(row.vive_con).toUpperCase(),
    religion: s(row.religion),
    tipoSangre: s(row.tipo_sangre),
    enfermedades: s(row.enfermedades) || 'Ninguna',
    alergias: s(row.alergias) || 'Ninguna',
    bautizado: siNo(row.bautizado),
    comunion: siNo(row.comunion),
    confirmado: siNo(row.confirmado),
    cursoParvularia: siNo(row.parvularia),
    centroProcedencia: s(row.centro_procedencia),

    // Familia
    padre: contacto(row.nombre_padre, row.profesion_padre, row.lugar_trabajo_padre, row.cargo_padre,
      row.tel_fijo_padre, row.tel_oficina_padre, row.tel_celular_padre, row.correo_padre, row.religion_padre),
    madre: contacto(row.nombre_madre, row.profesion_madre, row.lugar_trabajo_madre, row.cargo_madre,
      row.tel_fijo_madre, row.tel_oficina_madre, row.tel_celular_madre, row.correo_madre, row.religion_madre),
    encargado: contacto(row.nombre_encargado, row.profesion_encargado, row.lugar_trabajo_encargado, row.cargo_encargado,
      row.tel_fijo_encargado, row.tel_oficina_encargado, row.tel_celular_encargado, row.correo_encargado, row.religion_encargado),
    responsable: s(row.responsable).toUpperCase(),

    // Emergencia
    emergencia: {
      llamarA: s(row.emergencia),
      telefono: s(row.tel_emergencia),
    },

    // Transporte
    transporte: {
      tipo: s(row.transporte).toUpperCase() || 'VEHICULO PROPIO',
      nombreMotorista: s(row.nombre_motorista),
      placa: s(row.placa),
      telefonoMotorista: s(row.tel_motorista),
    },

    // Facturación: no existe en la tabla SQL; se precarga con los datos del padre
    // y la familia la completa/corrige al ratificar la matrícula.
    facturacion: {
      nombreCompleto: s(row.nombre_padre),
      direccion: s(row.direccion),
      telefono: s(row.tel_celular_padre),
      email: s(row.correo_padre),
      dui: '',
      nit: '',
      profesion: s(row.profesion_padre),
      parentesco: s(row.nombre_padre) ? 'PADRE' : '',
    },

    importadoDesdeSql: true,
  };
}

// ============================================
// SERVICIO
// ============================================
export interface ResultadoImportacion {
  total: number;
  importados: number;
  errores: { carnet: string; error: string }[];
}

export const alumnoService = {
  /** Obtiene un alumno por carnet (o null si no existe). */
  async getAlumno(carnet: string): Promise<AlumnoReingreso | null> {
    const limpio = (carnet || '').trim();
    if (!limpio) return null;
    const snap = await getDoc(doc(db, COLECCION_ALUMNOS, limpio));
    return snap.exists() ? (snap.data() as AlumnoReingreso) : null;
  },

  /**
   * Login del portal de reingreso: carnet + PIN.
   * Devuelve el alumno si las credenciales son válidas y está activo; si no, null.
   */
  async loginReingreso(carnet: string, pin: string): Promise<AlumnoReingreso | null> {
    const alumno = await this.getAlumno(carnet);
    if (!alumno) return null;
    if ((alumno.estado || 'ACTIVO') !== 'ACTIVO') return null;
    if ((alumno.pin || '') !== (pin || '').trim()) return null;
    return alumno;
  },

  /** Actualiza campos del alumno (ratificación de datos del formulario). */
  async updateAlumno(carnet: string, cambios: Partial<AlumnoReingreso>): Promise<void> {
    await updateDoc(doc(db, COLECCION_ALUMNOS, carnet), {
      ...cambios,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /** Marca la ratificación de matrícula con los datos confirmados por la familia. */
  async ratificarDatos(carnet: string, cambios: Partial<AlumnoReingreso>): Promise<void> {
    await updateDoc(doc(db, COLECCION_ALUMNOS, carnet), {
      ...cambios,
      ratificadoAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /** Cambia el PIN de acceso del alumno. */
  async cambiarPin(carnet: string, nuevoPin: string): Promise<void> {
    await updateDoc(doc(db, COLECCION_ALUMNOS, carnet), {
      pin: nuevoPin.trim(),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  /** Lista completa (para paneles administrativos). */
  async getAllAlumnos(): Promise<AlumnoReingreso[]> {
    const snap = await getDocs(collection(db, COLECCION_ALUMNOS));
    return snap.docs.map(d => d.data() as AlumnoReingreso);
  },

  /**
   * Importación masiva desde la tabla [dbo].[alumno] de SQL Server.
   * Sube en lotes de 400 (límite de Firestore: 500 operaciones por batch).
   * Usa merge para no borrar campos ya existentes si se re-ejecuta.
   */
  async importAlumnosDesdeSql(rows: AlumnoSqlRow[]): Promise<ResultadoImportacion> {
    const resultado: ResultadoImportacion = { total: rows.length, importados: 0, errores: [] };
    const TAMANO_LOTE = 400;

    for (let i = 0; i < rows.length; i += TAMANO_LOTE) {
      const lote = rows.slice(i, i + TAMANO_LOTE);
      const batch = writeBatch(db);
      const validos: string[] = [];

      for (const row of lote) {
        try {
          const carnet = s(row.carnet);
          if (!carnet) throw new Error('Fila sin carnet');
          const alumno = mapSqlRowToAlumno(row);
          batch.set(
            doc(db, COLECCION_ALUMNOS, carnet),
            { ...alumno, createdAt: Timestamp.fromDate(new Date()), updatedAt: Timestamp.fromDate(new Date()) },
            { merge: true }
          );
          validos.push(carnet);
        } catch (e) {
          resultado.errores.push({ carnet: s(row.carnet) || '(sin carnet)', error: e instanceof Error ? e.message : 'Error desconocido' });
        }
      }

      try {
        await batch.commit();
        resultado.importados += validos.length;
      } catch (e) {
        for (const carnet of validos) {
          resultado.errores.push({ carnet, error: e instanceof Error ? e.message : 'Error al confirmar el lote' });
        }
      }
    }

    return resultado;
  },
};
