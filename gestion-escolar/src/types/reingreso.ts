// src/types/reingreso.ts
// Tipos para el módulo de REINGRESO (alumnos de antiguo ingreso).
//
// - AlumnoSqlRow:     fila cruda tal como viene de la tabla [dbo].[alumno] de SQL Server (cssj_db).
// - AlumnoReingreso:  documento que vive en Firestore (colección 'alumnos', id = carnet),
//                     con la misma forma que ya consumen las pantallas de reingreso.

/** Datos de contacto de padre / madre / encargado (forma usada por las pantallas). */
export interface ContactoFamiliar {
  nombre: string;
  lugarTrabajo: string;
  telefonoTrabajo: string;
  profesion: string;
  cargo: string;
  telefonoFijo: string;
  telefonoMovil: string;
  email: string;
  religion: string;
}

/** Datos del sostenedor económico para facturación (no existen en la tabla SQL; se completan en el formulario). */
export interface DatosFacturacion {
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  email: string;
  dui: string;
  nit: string;
  profesion: string;
  parentesco: string;
}

/**
 * Documento del alumno de antiguo ingreso en Firestore.
 * Colección: 'alumnos' | ID del documento: carnet (8 dígitos).
 */
export interface AlumnoReingreso {
  // === CONTROL DE INGRESO ===
  anioIngreso: string;       // Año en que ingresó al colegio (anho_ingreso)
  gradoActual: string;       // Grado que cursó/cursa actualmente (nombre legible)
  gradoMatricular: string;   // Grado al que se matricula (calculado: siguiente al actual)

  // === ACCESO AL PORTAL ===
  pin: string;               // PIN de acceso al portal de reingreso
  estado: string;            // 'ACTIVO' | 'INACTIVO' | 'RETIRADO' (columna estado de SQL)

  // === DATOS DEL ALUMNO ===
  carnet: string;
  nie: string;
  nombres: string;
  apellidos: string;
  sexo: string;              // 'MASCULINO' | 'FEMENINO'
  fechaNac: string;          // 'YYYY-MM-DD'
  nacionalidad: string;
  zona: string;              // 'URBANA' | 'RURAL'
  departamento: string;
  municipio: string;
  telefono: string;
  direccion: string;
  viveCon: string;
  religion: string;
  tipoSangre: string;
  enfermedades: string;
  alergias: string;
  bautizado: string;         // 'SI' | 'NO'
  confirmado: string;
  comunion: string;
  cursoParvularia: string;
  centroProcedencia: string;

  // === FAMILIA ===
  padre: ContactoFamiliar;
  madre: ContactoFamiliar;
  encargado: ContactoFamiliar;
  responsable: string;       // Quién responde por el alumno

  // === EMERGENCIA ===
  emergencia: {
    llamarA: string;
    telefono: string;
  };

  // === TRANSPORTE ===
  transporte: {
    tipo: string;            // 'VEHICULO PROPIO' | 'MICROBUS ESCOLAR' | ...
    nombreMotorista: string;
    placa: string;
    telefonoMotorista: string;
  };

  // === FACTURACIÓN ===
  facturacion: DatosFacturacion;

  // === METADATOS ===
  importadoDesdeSql?: boolean;  // true si vino de la migración de cssj_db
  createdAt?: Date;
  updatedAt?: Date;
  ratificadoAt?: Date;          // Cuándo confirmó/actualizó sus datos en el formulario
}

/**
 * Fila cruda de la tabla [dbo].[alumno] de SQL Server.
 * Los nombres coinciden 1:1 con las columnas para poder pegar los datos exportados sin transformarlos.
 */
export interface AlumnoSqlRow {
  carnet: string;                       // varchar(8) PK
  nie?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  sexo?: string | null;
  fecha_nac?: string | null;            // varchar(10)
  id_nacionalidad?: string | null;      // varchar(2) FK nacionalidad
  direccion?: string | null;
  zona?: string | null;
  id_municipio?: string | null;         // varchar(4) FK municipio
  id_departamento?: string | null;      // varchar(2) FK departamento
  telefono_fijo?: string | null;
  tipo_sangre?: string | null;
  enfermedades?: string | null;
  alergias?: string | null;
  centro_procedencia?: string | null;
  anho_ingreso?: number | null;
  grado_ingreso?: string | null;        // varchar(3) FK grado
  religion?: string | null;
  bautizado?: string | null;
  comunion?: string | null;
  confirmado?: string | null;
  parvularia?: string | null;
  vive_con?: string | null;
  nombre_padre?: string | null;
  profesion_padre?: string | null;
  lugar_trabajo_padre?: string | null;
  cargo_padre?: string | null;
  tel_fijo_padre?: string | null;
  tel_oficina_padre?: string | null;
  tel_celular_padre?: string | null;
  correo_padre?: string | null;
  religion_padre?: string | null;
  nombre_madre?: string | null;
  profesion_madre?: string | null;
  lugar_trabajo_madre?: string | null;
  cargo_madre?: string | null;
  tel_fijo_madre?: string | null;
  tel_oficina_madre?: string | null;
  tel_celular_madre?: string | null;
  correo_madre?: string | null;
  religion_madre?: string | null;
  nombre_encargado?: string | null;
  profesion_encargado?: string | null;
  lugar_trabajo_encargado?: string | null;
  cargo_encargado?: string | null;
  tel_fijo_encargado?: string | null;
  tel_oficina_encargado?: string | null;
  tel_celular_encargado?: string | null;
  correo_encargado?: string | null;
  religion_encargado?: string | null;
  responsable?: string | null;
  emergencia?: string | null;
  tel_emergencia?: string | null;
  transporte?: string | null;
  nombre_motorista?: string | null;
  tel_motorista?: string | null;
  placa?: string | null;
  estado?: string | null;

  // Campos OPCIONALES extra (no están en la tabla alumno, pero si los mandas se respetan):
  grado_actual?: string | null;         // Código o nombre del grado que cursa HOY (si difiere de grado_ingreso)
  pin?: string | null;                  // PIN personalizado; si no viene se genera uno por defecto
}
