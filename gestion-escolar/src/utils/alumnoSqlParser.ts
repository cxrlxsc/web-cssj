// src/utils/alumnoSqlParser.ts
// Parser del volcado de la tabla [dbo].[alumno] de SQL Server (cssj_db).
//
// Formato esperado: un alumno por línea, 60 columnas separadas por TABULADOR,
// en el mismo orden que las columnas de la tabla (el export estándar de
// "Resultados a archivo" / bcp de SQL Server Management Studio).
//
// Se usa desde /admin/importar-alumnos para leer el archivo datos.sql completo
// sin tener que pegar los alumnos uno por uno.
import type { AlumnoSqlRow } from '../types/reingreso';

// Las 60 columnas de dbo.alumno en orden físico (la columna 'foto' se ignora: es binaria).
const COLUMNAS = [
  'carnet', 'nie', 'nombres', 'apellidos', 'sexo', 'fecha_nac', 'id_nacionalidad',
  'direccion', 'zona', 'id_municipio', 'id_departamento', 'telefono_fijo',
  'tipo_sangre', 'enfermedades', 'alergias', 'centro_procedencia',
  'anho_ingreso', 'grado_ingreso', 'religion', 'bautizado', 'comunion',
  'confirmado', 'parvularia', 'vive_con',
  'nombre_padre', 'profesion_padre', 'lugar_trabajo_padre', 'cargo_padre',
  'tel_fijo_padre', 'tel_oficina_padre', 'tel_celular_padre', 'correo_padre', 'religion_padre',
  'nombre_madre', 'profesion_madre', 'lugar_trabajo_madre', 'cargo_madre',
  'tel_fijo_madre', 'tel_oficina_madre', 'tel_celular_madre', 'correo_madre', 'religion_madre',
  'nombre_encargado', 'profesion_encargado', 'lugar_trabajo_encargado', 'cargo_encargado',
  'tel_fijo_encargado', 'tel_oficina_encargado', 'tel_celular_encargado', 'correo_encargado', 'religion_encargado',
  'responsable', 'emergencia', 'tel_emergencia',
  'transporte', 'nombre_motorista', 'tel_motorista', 'placa',
  'foto', 'estado',
] as const;

export interface ErrorParseo {
  linea: number;      // Número de línea en el archivo (1-based)
  carnet: string;     // Primer campo de la línea, para ubicarla
  motivo: string;
}

export interface ResultadoParseo {
  rows: AlumnoSqlRow[];
  errores: ErrorParseo[];
}

/**
 * Convierte el texto completo del volcado (datos.sql) en filas AlumnoSqlRow.
 * Las líneas que no tengan exactamente 60 columnas (p. ej. con tabuladores
 * metidos dentro de un texto) se reportan en `errores` para corregirlas a mano.
 */
export function parseAlumnosSqlDump(texto: string): ResultadoParseo {
  const rows: AlumnoSqlRow[] = [];
  const errores: ErrorParseo[] = [];

  // Quitamos el BOM de UTF-8 si viene y separamos por líneas (CRLF o LF)
  const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/);

  lineas.forEach((linea, i) => {
    if (!linea.trim()) return; // líneas vacías al final del archivo

    const campos = linea.split('\t');
    const carnet = (campos[0] || '').trim();

    if (campos.length !== COLUMNAS.length) {
      errores.push({
        linea: i + 1,
        carnet: carnet || '(sin carnet)',
        motivo: `Tiene ${campos.length} columnas y se esperaban ${COLUMNAS.length} (probablemente hay tabuladores dentro de algún texto). Corregir manualmente.`,
      });
      return;
    }

    const row: Record<string, string | number | null> = {};
    COLUMNAS.forEach((col, j) => {
      if (col === 'foto') return; // binaria: no se migra
      const valor = (campos[j] || '').trim();
      if (col === 'anho_ingreso') {
        row[col] = valor ? parseInt(valor, 10) : null;
      } else {
        row[col] = valor;
      }
    });

    rows.push(row as unknown as AlumnoSqlRow);
  });

  return { rows, errores };
}
