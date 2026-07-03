// src/pages/admin/AdminPagosReingreso.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { admissionFinanceService } from '../../services/admissionFinanceService';
import { reingresoFinanceService } from '../../services/reingresoFinanceService';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import logoImg from '../../assets/logo.png';
import type { AdmissionFileReview } from '../../types';
import './adminStyles/AdminColecturia.css';

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Fila normalizada: unifica pagos de Nuevo Ingreso (admissions) y Reingreso (reingresoPayments).
interface PagoRow {
  key: string;
  tipo: 'nuevo' | 'reingreso';
  refId: string;       // admissionId (nuevo) o carnet (reingreso)
  carnet: string;
  studentName: string;
  grade: string;
  receipt: AdmissionFileReview;
}

export const AdminPagosReingreso = () => {
  const navigate = useNavigate();
  const { confirm, prompt, alert, dialogs } = useAdminDialogs();
  const [rows, setRows] = useState<PagoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PagoRow | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const [admisiones, reingresos] = await Promise.all([
        admissionService.getAllAdmissions(),
        reingresoFinanceService.getAllPayments(),
      ]);

      const nuevos: PagoRow[] = admisiones
        .filter(a => !!a.paymentReceipt)
        .map(a => ({
          key: `adm_${a.id}`,
          tipo: 'nuevo',
          refId: a.id,
          carnet: a.carnet || '—',
          studentName: `${a.studentFirstName} ${a.studentLastName}`,
          grade: a.gradeApplying,
          receipt: a.paymentReceipt!,
        }));

      const antiguos: PagoRow[] = reingresos
        .filter(r => !!r.paymentReceipt)
        .map(r => ({
          key: `rei_${r.carnet}`,
          tipo: 'reingreso',
          refId: r.carnet,
          carnet: r.carnet,
          studentName: r.studentName,
          grade: r.grade,
          receipt: r.paymentReceipt,
        }));

      setRows([...nuevos, ...antiguos]);
    } catch (error) {
      console.error('Error cargando pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarPagos(); }, []);

  const revisar = async (row: PagoRow, decision: 'approved' | 'rejected', reason?: string) => {
    if (row.tipo === 'nuevo') {
      await admissionFinanceService.reviewPayment(row.refId, decision, 'Admin_Colecturia', reason);
    } else {
      await reingresoFinanceService.reviewPayment(row.refId, decision, 'Admin_Colecturia', reason);
    }
  };

  const handleAprobar = async (row: PagoRow) => {
    const ok = await confirm({
      title: 'Aprobar pago',
      message: `¿Confirmar que el pago de ${row.studentName} fue recibido en el banco?\nEsto habilitará el paso de contrato para el alumno.`,
      confirmLabel: 'Aprobar Pago',
      tone: 'verde',
    });
    if (!ok) return;
    try {
      await revisar(row, 'approved');
      setSelected(null);
      await cargarPagos();
      await alert({ title: 'Pago aprobado', message: 'El paso de contrato queda habilitado para el alumno.', tone: 'success' });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo aprobar el pago.', tone: 'error' });
    }
  };

  const handleRechazar = async (row: PagoRow) => {
    const motivo = await prompt({
      title: 'Rechazar pago',
      message: 'Indica el motivo del rechazo (se mostrará a la familia):',
      placeholder: 'Ej: Comprobante ilegible, monto incorrecto...',
      confirmLabel: 'Rechazar Pago',
    });
    if (!motivo) return;
    try {
      await revisar(row, 'rejected', motivo);
      setSelected(null);
      await cargarPagos();
      await alert({ title: 'Pago rechazado', message: `Motivo enviado a la familia:\n"${motivo}"`, tone: 'info' });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo rechazar el pago.', tone: 'error' });
    }
  };

  const esPdf = (fileName?: string) => (fileName || '').toLowerCase().endsWith('.pdf');
  const pendientes = rows.filter(r => r.receipt.status === 'pending');

  const badgeTipo = (tipo: PagoRow['tipo']) => (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: tipo === 'nuevo' ? '#e0f2fe' : '#fef3c7', color: tipo === 'nuevo' ? '#0369a1' : '#92400e' }}>
      {tipo === 'nuevo' ? 'Nuevo Ingreso' : 'Reingreso'}
    </span>
  );

  return (
    <div className="admin-colecturia-layout">
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="colecturia-main">
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver a Recursos Internos
          </Link>
        </div>

        <header className="colecturia-header">
          <div className="header-titles">
            <h1>Control de Colecturía</h1>
            <p>Comprobantes de pago de matrícula de <strong>nuevo ingreso y reingreso</strong> cargados por las familias.</p>
          </div>
          <button onClick={cargarPagos} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refrescar Lista
          </button>
        </header>

        <div className="table-container">
          {loading ? (
            <div className="empty-state"><p>Cargando comprobantes...</p></div>
          ) : pendientes.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p>No hay comprobantes pendientes de revisión.</p>
            </div>
          ) : (
            <table className="colecturia-table">
              <thead>
                <tr>
                  <th>Carnet</th>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Origen</th>
                  <th>Comprobante</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map(row => (
                  <tr key={row.key}>
                    <td><span className="student-name">{row.carnet}</span></td>
                    <td><div className="student-name">{row.studentName}</div></td>
                    <td><span className="amount-badge">{row.grade}</span></td>
                    <td>{badgeTipo(row.tipo)}</td>
                    <td>
                      <button onClick={() => setSelected(row)} className="btn-action-table" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Ver Archivo
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleAprobar(row)} className="btn-action-table" style={{ backgroundColor: '#008C5A', color: 'white', borderColor: '#008C5A' }}>
                        Aprobar Pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              <div className="modal-header">
                <div>
                  <h2>Comprobante de Pago</h2>
                  <p>{selected.studentName} · {badgeTipo(selected.tipo)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="receipt-image-container" style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
                  {esPdf(selected.receipt.fileName) ? (
                    <iframe title="Comprobante" src={selected.receipt.fileUrl} style={{ width: '100%', height: '55vh', border: 'none', borderRadius: '8px' }} />
                  ) : (
                    <img src={selected.receipt.fileUrl} alt="Comprobante de pago" style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto' }} />
                  )}
                </div>
                <a href={selected.receipt.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', margin: '0.5rem 0', color: '#0068B3', fontWeight: 700 }}>
                  Abrir archivo en pestaña nueva ↗
                </a>

                <h3 style={{ margin: '0.5rem 0 1.5rem 0', color: '#030405' }}>Grado: <span style={{ color: '#008C5A' }}>{selected.grade}</span> · Enviado: {toDate(selected.receipt.uploadedAt)?.toLocaleDateString() || '—'}</h3>

                <div className="modal-actions" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => handleAprobar(selected)} className="btn-approve-large">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Validar y Aprobar Pago
                  </button>
                  <button onClick={() => handleRechazar(selected)} className="btn-reject-large">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Rechazar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {dialogs}
    </div>
  );
};
