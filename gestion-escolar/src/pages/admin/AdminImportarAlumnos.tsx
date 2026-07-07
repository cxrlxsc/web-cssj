// src/pages/admin/AdminImportarAlumnos.tsx
// Herramienta administrativa para inyectar en Firebase los alumnos de ANTIGUO INGRESO
// exportados de SQL Server (tabla dbo.alumno). Los datos se pegan en
// src/data/alumnosParaImportar.ts y desde aquí se ejecuta la carga en lote.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumnosParaImportar } from '../../data/alumnosParaImportar';
import { alumnoService, mapSqlRowToAlumno, pinPorDefecto, type ResultadoImportacion } from '../../services/alumnoService';

export const AdminImportarAlumnos = () => {
  const navigate = useNavigate();
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  // Vista previa de cómo quedarán los primeros registros
  const preview = alumnosParaImportar.slice(0, 10).map(row => {
    const alumno = mapSqlRowToAlumno(row);
    return {
      carnet: alumno.carnet,
      nombre: `${alumno.nombres} ${alumno.apellidos}`.trim(),
      gradoActual: alumno.gradoActual,
      gradoMatricular: alumno.gradoMatricular,
      pin: pinPorDefecto(row),
      estado: alumno.estado,
    };
  });

  const handleImportar = async () => {
    if (alumnosParaImportar.length === 0) return;
    const confirmar = window.confirm(
      `Se importarán ${alumnosParaImportar.length} alumnos a la colección 'alumnos' de Firebase.\n\n` +
      `Si un carnet ya existe, sus datos se actualizarán (merge). ¿Continuar?`
    );
    if (!confirmar) return;

    setImportando(true);
    setResultado(null);
    try {
      const res = await alumnoService.importAlumnosDesdeSql(alumnosParaImportar);
      setResultado(res);
    } catch (e) {
      alert(`Error inesperado durante la importación: ${e instanceof Error ? e.message : e}`);
    } finally {
      setImportando(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
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

      {/* RESUMEN */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#0068B3' }}>Datos preparados en el archivo</h3>
        <p style={{ color: '#334155', margin: '0 0 1rem 0' }}>
          Registros detectados en <code>src/data/alumnosParaImportar.ts</code>:{' '}
          <strong style={{ fontSize: '1.2rem' }}>{alumnosParaImportar.length}</strong>
        </p>

        {alumnosParaImportar.length === 0 ? (
          <div style={{ background: '#fef3c7', color: '#854d0e', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            No hay datos para importar. Pega las filas exportadas de la tabla <strong>dbo.alumno</strong> en{' '}
            <code>src/data/alumnosParaImportar.ts</code> y recarga esta página.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '0.5rem' }}>Carnet</th>
                    <th style={{ padding: '0.5rem' }}>Nombre</th>
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
                      <td style={{ padding: '0.5rem' }}>{p.gradoActual}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#008C5A' }}>{p.gradoMatricular}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.pin}</td>
                      <td style={{ padding: '0.5rem' }}>{p.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {alumnosParaImportar.length > 10 && (
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Mostrando los primeros 10 de {alumnosParaImportar.length} registros.
              </p>
            )}
            <button
              onClick={handleImportar}
              disabled={importando}
              style={{ marginTop: '1.5rem', padding: '0.9rem 2rem', background: importando ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: importando ? 'wait' : 'pointer' }}
            >
              {importando ? 'Importando…' : `Importar ${alumnosParaImportar.length} alumnos a Firebase`}
            </button>
          </>
        )}
      </div>

      {/* RESULTADO */}
      {resultado && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: resultado.errores.length === 0 ? '5px solid #22c55e' : '5px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Resultado de la importación</h3>
          <p style={{ margin: '0 0 0.5rem 0', color: '#166534', fontWeight: 'bold' }}>
            ✅ Importados correctamente: {resultado.importados} de {resultado.total}
          </p>
          {resultado.errores.length > 0 && (
            <>
              <p style={{ margin: '1rem 0 0.5rem 0', color: '#b91c1c', fontWeight: 'bold' }}>⚠️ Errores ({resultado.errores.length}):</p>
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
  );
};

export default AdminImportarAlumnos;
