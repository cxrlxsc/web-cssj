// src/pages/admin/AdminImportarAlumnos.tsx
// Herramienta administrativa para inyectar en Firebase los alumnos de ANTIGUO INGRESO
// exportados de SQL Server (tabla dbo.alumno).
//
// Dos fuentes de datos (se combinan):
//   1. ARCHIVO: se selecciona el volcado completo (datos.sql, tab-separado) y se
//      parsea en el navegador — es la vía para importar los ~2196 alumnos de una vez.
//   2. src/data/alumnosParaImportar.ts: filas corregidas a mano (p. ej. las que el
//      volcado trae con tabuladores rotos). Estas tienen prioridad sobre el archivo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumnosParaImportar } from '../../data/alumnosParaImportar';
import { parseAlumnosSqlDump, type ErrorParseo } from '../../utils/alumnoSqlParser';
import { alumnoService, mapSqlRowToAlumno, pinPorDefecto, GRADUADO, type ResultadoImportacion } from '../../services/alumnoService';
import { configService } from '../../services/configService';
import logoImg from '../../assets/logo.png';
import type { AlumnoSqlRow } from '../../types/reingreso';

export const AdminImportarAlumnos = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [anioMatricula, setAnioMatricula] = useState<number>(new Date().getFullYear());
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    configService.getAnioMatricula().then(setAnioMatricula).catch(() => { /* usa el año actual */ });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);
  const [rowsArchivo, setRowsArchivo] = useState<AlumnoSqlRow[]>([]);
  const [erroresParseo, setErroresParseo] = useState<ErrorParseo[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');

  // Combinamos archivo + correcciones manuales (las manuales ganan por carnet)
  const rows = useMemo(() => {
    const porCarnet = new Map<string, AlumnoSqlRow>();
    for (const row of rowsArchivo) porCarnet.set((row.carnet || '').trim(), row);
    for (const row of alumnosParaImportar) porCarnet.set((row.carnet || '').trim(), row);
    porCarnet.delete('');
    return Array.from(porCarnet.values());
  }, [rowsArchivo]);

  // Resumen de cómo quedarán los datos al mapearse
  const resumen = useMemo(() => {
    let graduados = 0, activos = 0, inactivos = 0;
    for (const row of rows) {
      const alumno = mapSqlRowToAlumno(row, anioMatricula);
      if (alumno.gradoMatricular === GRADUADO) graduados++;
      if (alumno.estado === 'ACTIVO') activos++; else inactivos++;
    }
    return { graduados, activos, inactivos, matriculables: rows.length - graduados };
  }, [rows, anioMatricula]);

  const preview = useMemo(() => rows.slice(0, 10).map(row => {
    const alumno = mapSqlRowToAlumno(row, anioMatricula);
    return {
      carnet: alumno.carnet,
      nombre: `${alumno.nombres} ${alumno.apellidos}`.trim(),
      anioIngreso: alumno.anioIngreso,
      gradoActual: alumno.gradoActual,
      gradoMatricular: alumno.gradoMatricular,
      pin: pinPorDefecto(row),
      estado: alumno.estado,
    };
  }), [rows, anioMatricula]);

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResultado(null);
    try {
      const texto = await file.text();
      const { rows: parseadas, errores } = parseAlumnosSqlDump(texto);
      setRowsArchivo(parseadas);
      setErroresParseo(errores);
      setNombreArchivo(file.name);
    } catch {
      alert('No se pudo leer el archivo. Verifica que sea el volcado de texto de la tabla alumno.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportar = async () => {
    if (rows.length === 0) return;
    const confirmar = window.confirm(
      `Se importarán ${rows.length} alumnos a la colección 'alumnos' de Firebase.\n\n` +
      `Si un carnet ya existe, sus datos se actualizarán (merge). ¿Continuar?`
    );
    if (!confirmar) return;

    setImportando(true);
    setResultado(null);
    try {
      const res = await alumnoService.importAlumnosDesdeSql(rows);
      setResultado(res);
    } catch (e) {
      alert(`Error inesperado durante la importación: ${e instanceof Error ? e.message : e}`);
    } finally {
      setImportando(false);
    }
  };

  const statBox = (valor: number | string, etiqueta: string, color: string) => (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem 1.5rem', textAlign: 'center' }}>
      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color }}>{valor}</span>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{etiqueta}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* NAVBAR VERDE INSTITUCIONAL */}
      <nav style={{ background: '#008C5A', color: 'white', padding: '0.9rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <img src={logoImg} alt="Logo" style={{ height: '42px' }} />
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
          Cerrar Sesión
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '2.5rem auto', padding: '0 1rem' }}>
      {/* HEADER */}
      <div style={{ background: '#002a4a', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem' }}>Importar Alumnos de Antiguo Ingreso</h1>
          <p style={{ margin: 0, opacity: 0.85 }}>Migración desde SQL Server (tabla alumno) hacia Firebase</p>
        </div>
        <button onClick={() => navigate('/admin/dashboard')} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Volver al Panel
        </button>
      </div>

      {/* PASO 1: CARGAR ARCHIVO */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem', borderLeft: '5px solid #0068B3' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#0068B3' }}>1. Cargar el volcado de SQL Server</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
          Selecciona el archivo exportado de la tabla <strong>dbo.alumno</strong> (un alumno por línea,
          columnas separadas por tabulador — p. ej. <code>datos.sql</code>). Se parsea en tu navegador;
          nada se sube a Firebase hasta que presiones Importar.
        </p>
        <input type="file" accept=".sql,.txt,.tsv,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleArchivo} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Seleccionar archivo…
          </button>
          {nombreArchivo && (
            <span style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.9rem' }}>
              ✅ {nombreArchivo}: {rowsArchivo.length} alumnos leídos
              {erroresParseo.length > 0 && <span style={{ color: '#b91c1c' }}> · {erroresParseo.length} líneas con problema</span>}
            </span>
          )}
          {alumnosParaImportar.length > 0 && (
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              + {alumnosParaImportar.length} filas corregidas a mano en <code>alumnosParaImportar.ts</code>
            </span>
          )}
        </div>

        {erroresParseo.length > 0 && (() => {
          // Si el carnet con problema ya tiene una fila corregida a mano, no hay nada que hacer
          const carnetsCorregidos = new Set(alumnosParaImportar.map(r => (r.carnet || '').trim()));
          const pendientes = erroresParseo.filter(err => !carnetsCorregidos.has(err.carnet));
          const resueltos = erroresParseo.filter(err => carnetsCorregidos.has(err.carnet));
          return (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {resueltos.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem', color: '#166534' }}>
                  <strong>✅ Líneas del archivo con formato roto, pero YA RESUELTAS con una fila corregida a mano (no hay que hacer nada):</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {resueltos.map((err, i) => (
                      <li key={i}>Línea {err.linea} — carnet {err.carnet}: se importará desde alumnosParaImportar.ts</li>
                    ))}
                  </ul>
                </div>
              )}
              {pendientes.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', fontSize: '0.85rem', color: '#7f1d1d' }}>
                  <strong>⚠️ Líneas que no se pudieron leer y NO se importarán (corrígelas en el archivo o agrégalas a alumnosParaImportar.ts):</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                    {pendientes.map((err, i) => (
                      <li key={i}>Línea {err.linea} (carnet {err.carnet}): {err.motivo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* PASO 2: REVISAR Y EJECUTAR */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem', borderLeft: '5px solid #008C5A' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#008C5A' }}>2. Revisar e importar</h3>

        {rows.length === 0 ? (
          <div style={{ background: '#fef3c7', color: '#854d0e', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            Aún no hay datos: carga el archivo del paso 1 (o pega filas en <code>src/data/alumnosParaImportar.ts</code>).
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {statBox(rows.length, 'Total a importar', '#0f172a')}
              {statBox(resumen.matriculables, `Con grado ${anioMatricula} asignable`, '#008C5A')}
              {statBox(resumen.graduados, 'Ya graduados', '#64748b')}
              {statBox(resumen.activos, 'Estado ACTIVO', '#0068B3')}
              {statBox(resumen.inactivos, 'Estado INACTIVO', '#b91c1c')}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>Carnet</th>
                    <th style={{ padding: '0.5rem' }}>Nombre</th>
                    <th style={{ padding: '0.5rem' }}>Ingreso</th>
                    <th style={{ padding: '0.5rem' }}>Grado actual</th>
                    <th style={{ padding: '0.5rem' }}>Grado a matricular</th>
                    <th style={{ padding: '0.5rem' }}>PIN de acceso</th>
                    <th style={{ padding: '0.5rem' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(p => (
                    <tr key={p.carnet} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.carnet}</td>
                      <td style={{ padding: '0.5rem' }}>{p.nombre}</td>
                      <td style={{ padding: '0.5rem' }}>{p.anioIngreso}</td>
                      <td style={{ padding: '0.5rem' }}>{p.gradoActual}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold', color: p.gradoMatricular === GRADUADO ? '#64748b' : '#008C5A' }}>{p.gradoMatricular}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.pin}</td>
                      <td style={{ padding: '0.5rem' }}>{p.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 && (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Mostrando los primeros 10 de {rows.length} registros.
              </p>
            )}
            <button
              onClick={handleImportar}
              disabled={importando}
              style={{ marginTop: '1.5rem', padding: '0.9rem 2rem', background: importando ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: importando ? 'wait' : 'pointer' }}
            >
              {importando ? 'Importando… (no cierres esta página)' : `Importar ${rows.length} alumnos a Firebase`}
            </button>
          </>
        )}
      </div>

      {/* RESULTADO */}
      {resultado && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: resultado.errores.length === 0 ? '5px solid #22c55e' : '5px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Resultado de la importación</h3>
          <p style={{ margin: '0 0 0.5rem 0', color: '#166534', fontWeight: 'bold' }}>
            Importados correctamente: {resultado.importados} de {resultado.total}
          </p>
          {resultado.errores.length > 0 && (
            <>
              <p style={{ margin: '1rem 0 0.5rem 0', color: '#b91c1c', fontWeight: 'bold' }}>Errores ({resultado.errores.length}):</p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#7f1d1d', fontSize: '0.85rem' }}>
                {resultado.errores.map((err, i) => (
                  <li key={i}><strong>{err.carnet}</strong>: {err.error}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminImportarAlumnos;
