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
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { configService } from './configService';
import type { AlumnoReingreso, AlumnoSqlRow, ContactoFamiliar } from '../types/reingreso';
import type { Admission } from '../types';

const COLECCION_ALUMNOS = 'alumnos';

// ============================================
// GRADOS: catálogo OFICIAL del colegio (mismos códigos en la tabla grado de
// cssj_db y en los carnets del sistema nuevo — ver CARNET_GRADE_CODES en
// admissionService). OJO: NO son los códigos del NPE (npeGenerator usa otros).
// ============================================
const GRADO_NOMBRES: Record<string, string> = {
  '14': 'Kinder 4', '15': 'Kinder 5', '16': 'Preparatoria',
  '01': '1° Grado', '02': '2° Grado', '03': '3° Grado',
  '04': '4° Grado', '05': '5° Grado', '06': '6° Grado',
  '07': '7° Grado', '08': '8° Grado', '09': '9° Grado',
  '10': '1° Bachillerato', '11': '2° Bachillerato',
  '31': '1° Diseño Gráfico', '32': '2° Diseño Gráfico', '33': '3° Diseño Gráfico',
  '41': '1° Sistemas Eléctricos', '42': '2° Sistemas Eléctricos', '43': '3° Sistemas Eléctricos',
  '51': '1° Desarrollo de Software', '52': '2° Desarrollo de Software', '53': '3° Desarrollo de Software',
};

// Cadena de promoción del plan general: Kinder 4 -> ... -> 2° Bachillerato.
// Los técnicos (31-33, 41-43, 51-53) avanzan dentro de su propia carrera de 3 años.
const CADENA_GENERAL = ['14', '15', '16', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];

export const GRADUADO = 'Graduado';

/**
 * Año base de la migración inicial desde SQL Server. Los documentos de alumnos
 * que no tengan 'anioCalculo' (importados antes de existir ese campo) se asumen
 * calculados para este año. El año de matrícula ACTIVO vive en la configuración
 * del ciclo escolar (configService) y puede cambiar año con año.
 */
const ANIO_BASE_IMPORTACION = 2026;

/** Devuelve el código de grado a partir de un código ('02') o de un nombre ('2° Grado'). */
export function normalizarCodigoGrado(grado: string | null | undefined): string {
  const valor = (grado || '').trim();
  if (!valor) return '';
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

/** Avanza un código de grado N años dentro del plan. Devuelve el código destino o 'GRAD'. */
function avanzarCodigo(codigo: string, anios: number): string {
  if (anios <= 0) return codigo;
  // Carreras técnicas: 31-33, 41-43, 51-53 (3 años cada una)
  const tec = /^([345])([123])$/.exec(codigo);
  if (tec) {
    const anioCarrera = parseInt(tec[2], 10) + anios;
    return anioCarrera <= 3 ? `${tec[1]}${anioCarrera}` : 'GRAD';
  }
  const idx = CADENA_GENERAL.indexOf(codigo);
  if (idx === -1) return codigo; // código desconocido: no se avanza
  const destino = idx + anios;
  return destino < CADENA_GENERAL.length ? CADENA_GENERAL[destino] : 'GRAD';
}

/**
 * Grado que le corresponde cursar en el año `anio` a un alumno que ingresó en
 * `anhoIngreso` al grado `gradoIngreso` (asume promoción continua, sin repitencias).
 */
export function gradoEnAnio(gradoIngreso: string | null | undefined, anhoIngreso: number, anio: number): string {
  const codigo = normalizarCodigoGrado(gradoIngreso);
  if (!codigo) return '';
  const resultado = avanzarCodigo(codigo, Math.max(0, anio - anhoIngreso));
  return resultado === 'GRAD' ? GRADUADO : (GRADO_NOMBRES[resultado] ?? resultado);
}

/** Avanza un grado (por NOMBRE) N años. 'Graduado' y nombres desconocidos quedan igual. */
function avanzarNombreGrado(nombre: string, anios: number): string {
  if (!nombre || nombre === GRADUADO || anios <= 0) return nombre;
  const codigo = normalizarCodigoGrado(nombre);
  if (!codigo) return nombre;
  const resultado = avanzarCodigo(codigo, anios);
  return resultado === 'GRAD' ? GRADUADO : (GRADO_NOMBRES[resultado] ?? nombre);
}

/**
 * Ajusta los grados del alumno al ciclo escolar ACTIVO.
 * Los grados guardados se calcularon para 'anioCalculo' (ej: 2026); si el colegio
 * ya está matriculando un año posterior (ej: 2027), se avanzan automáticamente
 * sin necesidad de re-importar ni modificar los documentos.
 */
function ajustarGradosAlCiclo(alumno: AlumnoReingreso, anioActivo: number): AlumnoReingreso {
  const anioCalculo = alumno.anioCalculo || ANIO_BASE_IMPORTACION;
  const diferencia = anioActivo - anioCalculo;
  if (diferencia <= 0) return alumno;
  return {
    ...alumno,
    gradoActual: avanzarNombreGrado(alumno.gradoActual, diferencia),
    gradoMatricular: avanzarNombreGrado(alumno.gradoMatricular, diferencia),
  };
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

/** Convierte una fila de la tabla [dbo].[alumno] al documento de Firestore.
 *  `anioMatricula` es el ciclo que se está matriculando (viene de la configuración). */
export function mapSqlRowToAlumno(row: AlumnoSqlRow, anioMatricula: number = ANIO_BASE_IMPORTACION): AlumnoReingreso {
  const siNo = (v?: string | null) => (s(v).toUpperCase() === 'SI' ? 'SI' : 'NO');

  // Grado actual y grado a matricular:
  // - Si la fila trae grado_actual explícito, se usa ese y se avanza 1 año.
  // - Si no, se calcula desde grado_ingreso avanzando los años transcurridos
  //   hasta el año de matrícula (los que ya terminaron quedan como 'Graduado').
  const anhoIngreso = parseInt(s(row.anho_ingreso), 10) || anioMatricula;
  let gradoActual: string;
  let gradoMatricular: string;
  if (s(row.grado_actual)) {
    gradoActual = nombreGrado(row.grado_actual);
    gradoMatricular = gradoEnAnio(row.grado_actual, anioMatricula - 1, anioMatricula);
  } else {
    gradoActual = gradoEnAnio(row.grado_ingreso, anhoIngreso, Math.max(anhoIngreso, anioMatricula - 1));
    gradoMatricular = gradoEnAnio(row.grado_ingreso, anhoIngreso, anioMatricula);
  }

  return {
    // Ingreso
    anioIngreso: s(row.anho_ingreso),
    gradoActual,
    gradoMatricular,
    anioCalculo: anioMatricula, // para poder avanzar los grados en ciclos futuros

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
  /** Obtiene un alumno por carnet (o null si no existe).
   *  Los grados se ajustan automáticamente al ciclo escolar activo. */
  async getAlumno(carnet: string): Promise<AlumnoReingreso | null> {
    const limpio = (carnet || '').trim();
    if (!limpio) return null;
    const snap = await getDoc(doc(db, COLECCION_ALUMNOS, limpio));
    if (!snap.exists()) return null;
    const anioActivo = await configService.getAnioMatricula();
    return ajustarGradosAlCiclo(snap.data() as AlumnoReingreso, anioActivo);
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

  /** Lista completa (para paneles administrativos), con grados ajustados al ciclo activo. */
  async getAllAlumnos(): Promise<AlumnoReingreso[]> {
    const [snap, anioActivo] = await Promise.all([
      getDocs(collection(db, COLECCION_ALUMNOS)),
      configService.getAnioMatricula(),
    ]);
    return snap.docs.map(d => ajustarGradosAlCiclo(d.data() as AlumnoReingreso, anioActivo));
  },

  /**
   * MATRÍCULA OFICIAL DE NUEVO INGRESO: convierte una admisión (con contrato
   * firmado y aprobado) en un documento de la colección 'alumnos'.
   * A partir del siguiente ciclo, el alumno inicia sesión en el portal de
   * REINGRESO con su carnet + PIN (últimos 4 dígitos del carnet) y sigue el
   * mismo proceso que los alumnos antiguos.
   * Devuelve el carnet, o null si la admisión aún no tiene carnet asignado.
   */
  async crearAlumnoDesdeAdmision(admission: Admission): Promise<string | null> {
    const carnet = (admission.carnet || '').trim();
    if (!carnet) return null;

    const anio = admission.enrollmentYear || await configService.getAnioMatricula();
    const grado = nombreGrado(admission.gradeApplying) || admission.gradeApplying;

    const nacimiento = admission.dateOfBirth instanceof Date && !isNaN(admission.dateOfBirth.getTime())
      ? admission.dateOfBirth.toISOString().split('T')[0]
      : '';

    // El responsable registrado en la admisión se coloca como padre, madre o
    // encargado según el parentesco declarado; el resto se completa al ratificar.
    const contactoVacio: ContactoFamiliar = { nombre: '', profesion: '', lugarTrabajo: '', cargo: '', telefonoFijo: '', telefonoTrabajo: '', telefonoMovil: '', email: '', religion: '' };
    const responsable: ContactoFamiliar = {
      ...contactoVacio,
      nombre: `${admission.parentFirstName} ${admission.parentLastName}`.trim(),
      telefonoMovil: admission.parentPhone || '',
      email: admission.parentEmail || '',
    };
    const parentesco = (admission.parentRelationship || '').toLowerCase();
    const esMadre = parentesco.includes('madre') || parentesco.includes('mam');
    const esPadre = parentesco.includes('padre') || parentesco.includes('pap');

    const alumno: AlumnoReingreso = {
      // Ingreso
      anioIngreso: String(anio),
      gradoActual: grado,
      gradoMatricular: grado, // se matricula a este grado en su año de ingreso
      anioCalculo: anio,      // en ciclos futuros, los grados avanzan solos

      // Acceso al portal de reingreso
      pin: carnet.slice(-4),
      estado: 'ACTIVO',

      // Alumno
      carnet,
      nie: '',
      nombres: admission.studentFirstName || '',
      apellidos: admission.studentLastName || '',
      sexo: admission.gender === 'F' ? 'FEMENINO' : 'MASCULINO',
      fechaNac: nacimiento,
      nacionalidad: 'SALVADOREÑA',
      zona: '',
      departamento: admission.departamento || '',
      municipio: [admission.municipio, admission.distrito].filter(Boolean).join(', '),
      telefono: admission.parentPhone || '',
      direccion: admission.direccion || '',
      viveCon: '',
      religion: '',
      tipoSangre: '',
      enfermedades: 'Ninguna',
      alergias: 'Ninguna',
      bautizado: 'NO',
      comunion: 'NO',
      confirmado: 'NO',
      cursoParvularia: 'NO',
      centroProcedencia: admission.previousSchool || '',

      // Familia
      padre: esPadre ? responsable : contactoVacio,
      madre: esMadre ? responsable : contactoVacio,
      encargado: (!esPadre && !esMadre) ? responsable : contactoVacio,
      responsable: (admission.parentRelationship || 'ENCARGADO').toUpperCase(),

      emergencia: {
        llamarA: responsable.nombre,
        telefono: admission.parentPhone || '',
      },

      transporte: { tipo: 'VEHICULO PROPIO', nombreMotorista: '', placa: '', telefonoMotorista: '' },

      facturacion: {
        nombreCompleto: responsable.nombre,
        direccion: admission.direccion || '',
        telefono: admission.parentPhone || '',
        email: admission.parentEmail || '',
        dui: '',
        nit: '',
        profesion: '',
        parentesco: (admission.parentRelationship || '').toUpperCase(),
      },

      importadoDesdeSql: false,
    };

    await setDoc(
      doc(db, COLECCION_ALUMNOS, carnet),
      {
        ...alumno,
        origen: 'nuevo_ingreso',
        admissionId: admission.id,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      },
      { merge: true }
    );

    return carnet;
  },

  /**
   * Importación masiva desde la tabla [dbo].[alumno] de SQL Server.
   * Sube en lotes de 400 (límite de Firestore: 500 operaciones por batch).
   * Usa merge para no borrar campos ya existentes si se re-ejecuta.
   * Los grados se calculan para el año de matrícula ACTIVO (configuración del ciclo).
   */
  async importAlumnosDesdeSql(rows: AlumnoSqlRow[], anioMatricula?: number): Promise<ResultadoImportacion> {
    const anio = anioMatricula ?? await configService.getAnioMatricula();
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
          const alumno = mapSqlRowToAlumno(row, anio);
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
