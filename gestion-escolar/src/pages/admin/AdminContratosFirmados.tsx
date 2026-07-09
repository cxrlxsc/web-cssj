// src/pages/admin/AdminContratosFirmados.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { admissionFinanceService } from '../../services/admissionFinanceService';
import { reingresoFinanceService } from '../../services/reingresoFinanceService';
import { alumnoService } from '../../services/alumnoService';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import logoImg from '../../assets/logo.png';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import type { Admission, AdmissionFileReview } from '../../types';
import './adminStyles/AdminContratosFirmados.css';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Fila normalizada: unifica contratos de Nuevo Ingreso (admissions) y
// Reingreso (reingresoPayments), igual que hace la colecturía con los pagos.
interface ContratoRow {
  key: string;
  tipo: 'nuevo' | 'reingreso';
  refId: string;         // admissionId (nuevo) o carnet (reingreso)
  studentName: string;
  parentName: string;
  grade: string;
  carnet: string;
  contract: AdmissionFileReview;
  admission?: Admission; // solo nuevo ingreso (para la matrícula oficial)
}

export default function AdminContratosFirmados() {
  const navigate = useNavigate();
  const { confirm, prompt, alert, dialogs } = useAdminDialogs();
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ContratoRow | null>(null);
  // Red de seguridad: contrato de nuevo ingreso ya aprobado cuyo alumno NO existe
  // en la colección 'alumnos' (p. ej. un fallo a medio proceso). Permite completarla.
  const [matriculaIncompleta, setMatriculaIncompleta] = useState(false);
  const [completandoMatricula, setCompletandoMatricula] = useState(false);

  useEffect(() => {
    setMatriculaIncompleta(false);
    if (!selected || selected.tipo !== 'nuevo' || selected.contract.status !== 'approved') return;
    const carnet = selected.admission?.carnet;
    if (!carnet) return;
    let activo = true;
    alumnoService.getAlumno(carnet)
      .then(alumno => { if (activo && !alumno) setMatriculaIncompleta(true); })
      .catch(() => { /* sin conexión: no ofrecemos el botón */ });
    return () => { activo = false; };
  }, [selected]);

  const handleCompletarMatricula = async () => {
    if (!selected?.admission) return;
    setCompletandoMatricula(true);
    try {
      const resultado = await alumnoService.crearAlumnoDesdeAdmision(selected.admission);
      if (!resultado) throw new Error('Sin carnet');
      await admissionService.updateAdmissionStatus(selected.refId, 'enrolled', 'Admin_Registro');
      setMatriculaIncompleta(false);
      await alert({
        title: 'Matrícula completada',
        message: `${selected.studentName} ya forma parte del registro de alumnos.\n\nCarnet: ${resultado.carnet}${resultado.correo ? `\nCorreo institucional: ${resultado.correo}` : ''}\nPIN del portal de reingreso: ${resultado.pin}`,
        tone: 'success',
      });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo completar la matrícula. Intenta de nuevo.', tone: 'error' });
    } finally {
      setCompletandoMatricula(false);
    }
  };

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  const loadContratos = async () => {
    setLoading(true);
    try {
      const [admisiones, reingresos] = await Promise.all([
        admissionService.getAllAdmissions(),
        reingresoFinanceService.getAllPayments(),
      ]);

      const nuevos: ContratoRow[] = admisiones
        .filter(a => !!a.signedContract)
        .map(a => ({
          key: `adm_${a.id}`,
          tipo: 'nuevo',
          refId: a.id,
          studentName: `${a.studentFirstName} ${a.studentLastName}`,
          parentName: `${a.parentFirstName} ${a.parentLastName}`,
          grade: a.gradeApplying,
          carnet: a.carnet || '—',
          contract: a.signedContract!,
          admission: a,
        }));

      const antiguos: ContratoRow[] = reingresos
        .filter(r => !!r.signedContract)
        .map(r => ({
          key: `rei_${r.carnet}`,
          tipo: 'reingreso',
          refId: r.carnet,
          studentName: r.studentName,
          parentName: '—',
          grade: r.grade,
          carnet: r.carnet,
          contract: r.signedContract!,
        }));

      setContratos([...nuevos, ...antiguos]);
    } catch (error) {
      console.error('Error cargando contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContratos(); }, []);

  const handleAprobar = async (row: ContratoRow) => {
    // NUEVO INGRESO: sin carnet no hay matrícula posible. Se valida ANTES de
    // tocar nada, para no dejar contratos aprobados sin alumno creado.
    if (row.tipo === 'nuevo' && !row.admission?.carnet) {
      await alert({
        title: 'Falta un paso previo',
        message: `${row.studentName} aún no tiene carnet asignado.\n\nApruébalo primero en "Aprobación y Matrícula" (ahí se genera su carnet, correo y contraseña) y luego regresa a aprobar este contrato.`,
        tone: 'error',
      });
      return;
    }

    const ok = await confirm({
      title: row.tipo === 'nuevo' ? 'Aprobar y matricular' : 'Aprobar contrato',
      message: `¿Confirmas que el contrato de ${row.studentName} tiene las firmas correctas y es válido legalmente?\n${row.tipo === 'nuevo' ? 'Esto matriculará oficialmente al alumno.' : 'La matrícula del alumno queda oficializada.'}`,
      confirmLabel: 'Aprobar Contrato',
      tone: 'navy',
    });
    if (!ok) return;
    try {
      if (row.tipo === 'reingreso') {
        // Alumno antiguo: ya vive en la colección 'alumnos'; solo se aprueba el contrato.
        await reingresoFinanceService.reviewContract(row.refId, 'approved', 'Admin_Registro');
        setSelected(null);
        await loadContratos();
        await alert({ title: '¡Contrato aprobado!', message: 'La matrícula del alumno de reingreso queda oficializada.', tone: 'success' });
        return;
      }

      // NUEVO INGRESO — matrícula oficial: PRIMERO se crea el alumno en la
      // colección 'alumnos' con TODO su expediente (si esto falla, el contrato
      // queda pendiente y se puede reintentar). Desde el siguiente ciclo inicia
      // sesión como ANTIGUO INGRESO (reingreso) con su carnet + PIN (su NIE,
      // o últimos 4 del carnet si no tiene).
      const resultado = await alumnoService.crearAlumnoDesdeAdmision(row.admission!);
      if (!resultado) {
        throw new Error('La admisión no tiene carnet asignado.');
      }
      await admissionFinanceService.reviewContract(row.refId, 'approved', 'Admin_Registro');
      await admissionService.updateAdmissionStatus(row.refId, 'enrolled', 'Admin_Registro');

      setSelected(null);
      await loadContratos();
      await alert({
        title: '¡Alumno matriculado oficialmente!',
        message: `${row.studentName} ya forma parte del registro de alumnos.\n\nCarnet: ${resultado.carnet}${resultado.correo ? `\nCorreo institucional: ${resultado.correo}` : ''}\nPIN del portal de reingreso (próximos ciclos): ${resultado.pin}`,
        tone: 'success',
      });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo completar la matrícula. El contrato sigue pendiente: revisa la conexión e intenta de nuevo.', tone: 'error' });
    }
  };

  const handleRechazar = async (row: ContratoRow) => {
    const motivo = await prompt({
      title: 'Devolver contrato',
      message: 'Indica el motivo del rechazo (se mostrará a la familia):',
      placeholder: 'Ej: Falta la firma de la madre, documento borroso...',
      confirmLabel: 'Devolver Contrato',
    });
    if (!motivo) return;
    try {
      if (row.tipo === 'reingreso') {
        await reingresoFinanceService.reviewContract(row.refId, 'rejected', 'Admin_Registro', motivo);
      } else {
        await admissionFinanceService.reviewContract(row.refId, 'rejected', 'Admin_Registro', motivo);
      }
      setSelected(null);
      await loadContratos();
      await alert({ title: 'Contrato devuelto', message: `Motivo enviado a la familia:\n"${motivo}"`, tone: 'info' });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo rechazar el contrato.', tone: 'error' });
    }
  };

  const esPdf = (fileName?: string) => (fileName || '').toLowerCase().endsWith('.pdf');

  return (
    <div className="contratos-firmados-layout">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="contratos-main">
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver a Recursos Internos
          </Link>
        </div>

        <header className="contratos-header">
          <div className="header-titles">
            <h1>Auditoría de Contratos Firmados</h1>
            <p>Verifica las firmas y validez legal de los contratos subidos por las familias para concretar la matrícula.</p>
          </div>
          <button onClick={loadContratos} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refrescar Bandeja
          </button>
        </header>

        <div className="table-container">
          {loading ? (
            <div className="empty-state"><p>Cargando documentos legales...</p></div>
          ) : contratos.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p>No hay contratos subidos por el momento.</p>
            </div>
          ) : (
            <table className="contratos-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Grado Matricular</th>
                  <th>Fecha de Envío</th>
                  <th>Estado Legal</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map(row => {
                  const status = row.contract.status;
                  const fecha = toDate(row.contract.uploadedAt);
                  return (
                    <tr key={row.key}>
                      <td>
                        <div className="student-name">{row.studentName}</div>
                        <div className="parent-name">
                          {row.tipo === 'nuevo' ? `Resp: ${row.parentName}` : `Carnet: ${row.carnet}`}
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '999px', background: row.tipo === 'nuevo' ? '#e0f2fe' : '#fef3c7', color: row.tipo === 'nuevo' ? '#0369a1' : '#92400e' }}>
                            {row.tipo === 'nuevo' ? 'Nuevo Ingreso' : 'Reingreso'}
                          </span>
                        </div>
                      </td>
                      <td><span style={{ color: '#0068B3', fontWeight: 700 }}>{row.grade}</span></td>
                      <td style={{ color: '#64748b' }}>{fecha ? fecha.toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`status-badge ${status === 'pending' ? 'status-pending' : status === 'approved' ? 'status-approved' : 'status-rejected'}`}>
                          {status === 'pending' ? 'En Auditoría' : status === 'approved' ? 'Matriculado' : 'Devuelto'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setSelected(row)} className="btn-action-table">Auditar Documento</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Contrato de Servicios Educativos</h2>
                  <p>{selected.tipo === 'nuevo' ? 'Aspirante' : 'Alumno'}: {selected.studentName} | Carnet: {selected.carnet || '—'}</p>
                </div>
                <button onClick={() => setSelected(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="document-preview">
                  {esPdf(selected.contract.fileName) ? (
                    <iframe title="Contrato" src={selected.contract.fileUrl} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <img src={selected.contract.fileUrl} alt="Contrato firmado escaneado" />
                  )}
                </div>
                <a href={selected.contract.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', margin: '0.5rem 0 1rem', color: '#0068B3', fontWeight: 700 }}>
                  Abrir archivo en pestaña nueva ↗
                </a>

                {selected.contract.status === 'pending' && (
                  <div className="modal-actions">
                    <button onClick={() => handleAprobar(selected)} className="btn-approve-large">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Aprobar y Matricular Oficialmente
                    </button>
                    <button onClick={() => handleRechazar(selected)} className="btn-reject-large">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Devolver por Errores / Falta de Firma
                    </button>
                  </div>
                )}

                {selected.contract.status !== 'pending' && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: selected.contract.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${selected.contract.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>
                    <p style={{ margin: 0, color: '#030405', fontSize: '1.1rem' }}>
                      Estado: <span style={{ fontWeight: 800, color: selected.contract.status === 'approved' ? '#15803d' : '#b91c1c' }}>{selected.contract.status === 'approved' ? 'APROBADO (MATRICULADO)' : 'DEVUELTO A LA FAMILIA'}</span>
                    </p>
                    {selected.contract.status === 'rejected' && selected.contract.rejectionReason && (
                      <p style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.95rem' }}>
                        <strong>Motivo enviado:</strong> {selected.contract.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                {/* RED DE SEGURIDAD: contrato aprobado pero alumno ausente en 'alumnos' */}
                {matriculaIncompleta && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1.5rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <p style={{ margin: '0 0 1rem', color: '#92400e', fontWeight: 700 }}>
                      Atención: este contrato está aprobado, pero el alumno aún no aparece en el registro de alumnos.
                    </p>
                    <button
                      onClick={handleCompletarMatricula}
                      disabled={completandoMatricula}
                      className="btn-approve-large"
                      style={{ opacity: completandoMatricula ? 0.6 : 1 }}
                    >
                      {completandoMatricula ? 'Matriculando...' : 'Completar Matrícula Ahora'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {dialogs}
    </div>
  );
}
