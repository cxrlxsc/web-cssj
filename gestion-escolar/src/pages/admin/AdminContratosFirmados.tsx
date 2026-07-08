// src/pages/admin/AdminContratosFirmados.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { admissionFinanceService } from '../../services/admissionFinanceService';
import { alumnoService } from '../../services/alumnoService';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import logoImg from '../../assets/logo.png';
import type { Admission } from '../../types';
import './adminStyles/AdminContratosFirmados.css';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdminContratosFirmados() {
  const navigate = useNavigate();
  const { confirm, prompt, alert, dialogs } = useAdminDialogs();
  const [contratos, setContratos] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Admission | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const loadContratos = async () => {
    setLoading(true);
    try {
      const all = await admissionService.getAllAdmissions();
      // Solo los que ya subieron su contrato firmado.
      setContratos(all.filter(a => !!a.signedContract));
    } catch (error) {
      console.error('Error cargando contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContratos(); }, []);

  const handleAprobar = async (adm: Admission) => {
    const ok = await confirm({
      title: 'Aprobar y matricular',
      message: `¿Confirmas que el contrato de ${adm.studentFirstName} ${adm.studentLastName} tiene las firmas correctas y es válido legalmente?\nEsto matriculará oficialmente al alumno.`,
      confirmLabel: 'Aprobar y Matricular',
      tone: 'navy',
    });
    if (!ok) return;
    try {
      await admissionFinanceService.reviewContract(adm.id, 'approved', 'Admin_Registro');

      // MATRÍCULA OFICIAL: el aspirante pasa a la colección 'alumnos'.
      // Desde el siguiente ciclo iniciará sesión como ANTIGUO INGRESO (reingreso)
      // con su carnet + PIN (últimos 4 dígitos del carnet).
      const carnet = await alumnoService.crearAlumnoDesdeAdmision(adm);
      await admissionService.updateAdmissionStatus(adm.id, 'enrolled', 'Admin_Registro');

      setSelected(null);
      await loadContratos();
      await alert({
        title: '¡Contrato aprobado!',
        message: carnet
          ? `El alumno queda matriculado oficialmente y ya forma parte del registro de alumnos.\n\nCarnet: ${carnet}\nPIN del portal de reingreso (próximos ciclos): ${carnet.slice(-4)}`
          : 'El alumno queda matriculado, pero no tiene carnet asignado: apruébalo primero en "Aprobación y Matrícula" y vuelve a aprobar el contrato.',
        tone: 'success',
      });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo aprobar el contrato.', tone: 'error' });
    }
  };

  const handleRechazar = async (adm: Admission) => {
    const motivo = await prompt({
      title: 'Devolver contrato',
      message: 'Indica el motivo del rechazo (se mostrará a la familia):',
      placeholder: 'Ej: Falta la firma de la madre, documento borroso...',
      confirmLabel: 'Devolver Contrato',
    });
    if (!motivo) return;
    try {
      await admissionFinanceService.reviewContract(adm.id, 'rejected', 'Admin_Registro', motivo);
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
                {contratos.map(adm => {
                  const status = adm.signedContract!.status;
                  const fecha = toDate(adm.signedContract!.uploadedAt);
                  return (
                    <tr key={adm.id}>
                      <td>
                        <div className="student-name">{adm.studentFirstName} {adm.studentLastName}</div>
                        <div className="parent-name">Resp: {adm.parentFirstName} {adm.parentLastName}</div>
                      </td>
                      <td><span style={{ color: '#0068B3', fontWeight: 700 }}>{adm.gradeApplying}</span></td>
                      <td style={{ color: '#64748b' }}>{fecha ? fecha.toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`status-badge ${status === 'pending' ? 'status-pending' : status === 'approved' ? 'status-approved' : 'status-rejected'}`}>
                          {status === 'pending' ? 'En Auditoría' : status === 'approved' ? 'Matriculado' : 'Devuelto'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button onClick={() => setSelected(adm)} className="btn-action-table">Auditar Documento</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && selected.signedContract && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Contrato de Servicios Educativos</h2>
                  <p>Aspirante: {selected.studentFirstName} {selected.studentLastName} | Carnet: {selected.carnet || '—'}</p>
                </div>
                <button onClick={() => setSelected(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="document-preview">
                  {esPdf(selected.signedContract.fileName) ? (
                    <iframe title="Contrato" src={selected.signedContract.fileUrl} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <img src={selected.signedContract.fileUrl} alt="Contrato firmado escaneado" />
                  )}
                </div>
                <a href={selected.signedContract.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', margin: '0.5rem 0 1rem', color: '#0068B3', fontWeight: 700 }}>
                  Abrir archivo en pestaña nueva ↗
                </a>

                {selected.signedContract.status === 'pending' && (
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

                {selected.signedContract.status !== 'pending' && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: selected.signedContract.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${selected.signedContract.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>
                    <p style={{ margin: 0, color: '#030405', fontSize: '1.1rem' }}>
                      Estado: <span style={{ fontWeight: 800, color: selected.signedContract.status === 'approved' ? '#15803d' : '#b91c1c' }}>{selected.signedContract.status === 'approved' ? 'APROBADO (MATRICULADO)' : 'DEVUELTO A LA FAMILIA'}</span>
                    </p>
                    {selected.signedContract.status === 'rejected' && selected.signedContract.rejectionReason && (
                      <p style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.95rem' }}>
                        <strong>Motivo enviado:</strong> {selected.signedContract.rejectionReason}
                      </p>
                    )}
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
