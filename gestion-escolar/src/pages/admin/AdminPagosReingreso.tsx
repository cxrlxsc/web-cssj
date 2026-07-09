// src/pages/admin/AdminPagosReingreso.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { admissionFinanceService } from '../../services/admissionFinanceService';
import { reingresoFinanceService } from '../../services/reingresoFinanceService';
import { configService, GRADOS_ARANCEL, type ArancelGrado, type ConfigMatricula } from '../../services/configService';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import logoImg from '../../assets/logo.png';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import type { AdmissionFileReview } from '../../types';
import './adminStyles/AdminColecturia.css';

type TabColecturia = 'pendientes' | 'historial' | 'aranceles' | 'ciclo';

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

  // Submenú de la colecturía: comprobantes, historial, aranceles por grado y ciclo escolar
  const [tab, setTab] = useState<TabColecturia>('pendientes');
  const [aranceles, setAranceles] = useState<Record<string, ArancelGrado>>({});
  const [guardandoAranceles, setGuardandoAranceles] = useState(false);
  const [ciclo, setCiclo] = useState<ConfigMatricula | null>(null);
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);

  const handleLogout = async () => {
    await cerrarSesionAdmin();
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

  // Cargar la configuración: aranceles por grado (los grados sin cuota propia
  // heredan la cuota por defecto) y datos del ciclo escolar
  useEffect(() => {
    configService.getConfigMatricula().then(config => {
      const tabla: Record<string, ArancelGrado> = {};
      for (const grado of GRADOS_ARANCEL) {
        tabla[grado] = config.arancelesPorGrado?.[grado] || {
          cuotaMatricula: config.cuotaMatricula,
          cuotaMensualidad: config.cuotaMensualidad,
        };
      }
      setAranceles(tabla);
      setCiclo(config);
    }).catch(() => { /* la pestaña mostrará vacío y se puede refrescar */ });
  }, []);

  const handleGuardarCiclo = async () => {
    if (!ciclo) return;
    if (ciclo.anioMatricula < 2020 || ciclo.anioMatricula > 2100 || !ciclo.fechaLimitePago) {
      await alert({ title: 'Datos inválidos', message: 'Revisa el año de matrícula y la fecha límite de pago.', tone: 'error' });
      return;
    }
    const ok = await confirm({
      title: 'Guardar ciclo escolar',
      message: `El sistema pasará a operar la matrícula ${ciclo.anioMatricula}. Esto ajusta portales, talonarios, contratos y el grado calculado de cada alumno antiguo. ¿Continuar?`,
      confirmLabel: 'Guardar Ciclo',
      tone: 'verde',
    });
    if (!ok) return;

    setGuardandoCiclo(true);
    try {
      await configService.saveConfigMatricula({
        anioMatricula: ciclo.anioMatricula,
        fechaLimitePago: ciclo.fechaLimitePago,
        cuotaMatricula: ciclo.cuotaMatricula,
        cuotaMensualidad: ciclo.cuotaMensualidad,
      }, 'Admin_Colecturia');
      await alert({ title: 'Ciclo guardado', message: `El sistema ahora opera la matrícula ${ciclo.anioMatricula}.`, tone: 'success' });
    } catch {
      await alert({ title: 'Error', message: 'No se pudo guardar la configuración del ciclo.', tone: 'error' });
    } finally {
      setGuardandoCiclo(false);
    }
  };

  const handleGuardarAranceles = async () => {
    const invalido = Object.entries(aranceles).find(([, a]) => a.cuotaMatricula < 0 || a.cuotaMensualidad < 0 || isNaN(a.cuotaMatricula) || isNaN(a.cuotaMensualidad));
    if (invalido) {
      await alert({ title: 'Montos inválidos', message: `Revisa las cuotas de "${invalido[0]}": deben ser números válidos.`, tone: 'error' });
      return;
    }
    const ok = await confirm({
      title: 'Guardar aranceles',
      message: 'Los nuevos montos se aplicarán de inmediato a los talonarios NPE y contratos que se generen. ¿Guardar los cambios?',
      confirmLabel: 'Guardar Aranceles',
      tone: 'verde',
    });
    if (!ok) return;

    setGuardandoAranceles(true);
    try {
      await configService.saveConfigMatricula({ arancelesPorGrado: aranceles }, 'Admin_Colecturia');
      await alert({ title: 'Aranceles guardados', message: 'Los talonarios y contratos nuevos ya usan las cuotas actualizadas.', tone: 'success' });
    } catch {
      await alert({ title: 'Error', message: 'No se pudieron guardar los aranceles. Intenta de nuevo.', tone: 'error' });
    } finally {
      setGuardandoAranceles(false);
    }
  };

  const setArancel = (grado: string, campo: keyof ArancelGrado, valor: string) => {
    setAranceles(prev => ({
      ...prev,
      [grado]: { ...prev[grado], [campo]: valor === '' ? NaN : parseFloat(valor) },
    }));
  };

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
  const historial = rows.filter(r => r.receipt.status !== 'pending');

  const badgeEstado = (status: AdmissionFileReview['status']) => (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: '999px', background: status === 'approved' ? '#dcfce7' : '#fef2f2', color: status === 'approved' ? '#166534' : '#b91c1c' }}>
      {status === 'approved' ? 'Aprobado' : 'Rechazado'}
    </span>
  );

  const tabBtn = (id: TabColecturia, texto: string, cantidad?: number) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '0.7rem 1.4rem', border: 'none', borderRadius: '10px 10px 0 0', cursor: 'pointer',
        fontWeight: 800, fontSize: '0.92rem',
        background: tab === id ? 'white' : 'transparent',
        color: tab === id ? '#002a4a' : '#64748b',
        borderBottom: tab === id ? '3px solid #008C5A' : '3px solid transparent',
      }}
    >
      {texto}{cantidad !== undefined ? ` (${cantidad})` : ''}
    </button>
  );

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
            <h1>Colecturía y Aranceles</h1>
            <p>Revisa los comprobantes de pago y administra las cuotas de matrícula y mensualidad por grado.</p>
          </div>
          <button onClick={cargarPagos} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refrescar Lista
          </button>
        </header>

        {/* SUBMENÚ DE LA COLECTURÍA */}
        <div style={{ display: 'flex', gap: '0.3rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {tabBtn('pendientes', 'Comprobantes por Revisar', pendientes.length)}
          {tabBtn('historial', 'Pagos Revisados', historial.length)}
          {tabBtn('aranceles', 'Precios y Cuotas por Grado')}
          {tabBtn('ciclo', 'Ciclo Escolar')}
        </div>

        {/* PESTAÑA: CICLO ESCOLAR (año de matrícula, fecha límite y cuotas por defecto) */}
        {tab === 'ciclo' && (
          <div className="table-container">
            {!ciclo ? (
              <div className="empty-state"><p>Cargando configuración…</p></div>
            ) : (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '1.6rem', color: '#1e40af', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong>Cómo funciona:</strong> al iniciar cada nuevo proceso de matrícula solo cambias el año y la fecha aquí.
                  Todo el sistema se ajusta automáticamente: portales, talonarios NPE, contratos, códigos de acceso y el grado
                  calculado de cada alumno antiguo. Las cuotas de esta pestaña son las <strong>por defecto</strong>; las específicas
                  de cada grado se editan en "Precios y Cuotas por Grado".
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.3rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Año de Matrícula</label>
                    <input
                      type="number"
                      min={2020}
                      max={2100}
                      value={ciclo.anioMatricula}
                      onChange={(e) => setCiclo({ ...ciclo, anioMatricula: parseInt(e.target.value, 10) || 0 })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1.3rem', fontWeight: 800, color: '#002a4a', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fecha límite de pago</label>
                    <input
                      type="date"
                      value={ciclo.fechaLimitePago}
                      onChange={(e) => setCiclo({ ...ciclo, fechaLimitePago: e.target.value })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Matrícula por defecto (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ciclo.cuotaMatricula}
                      onChange={(e) => setCiclo({ ...ciclo, cuotaMatricula: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Mensualidad por defecto (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={ciclo.cuotaMensualidad}
                      onChange={(e) => setCiclo({ ...ciclo, cuotaMensualidad: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.6rem' }}>
                  <button
                    onClick={handleGuardarCiclo}
                    disabled={guardandoCiclo}
                    style={{ padding: '0.9rem 2rem', background: guardandoCiclo ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: guardandoCiclo ? 'wait' : 'pointer' }}
                  >
                    {guardandoCiclo ? 'Guardando…' : 'Guardar Ciclo Escolar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: ARANCELES POR GRADO */}
        {tab === 'aranceles' && (
          <div className="table-container">
            <div style={{ padding: '1.2rem 1.2rem 0.4rem' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Define la <strong>matrícula</strong> (monto que cobra el talonario NPE en el banco) y la <strong>mensualidad</strong> (usada
                en el contrato) de cada grado. Los cambios aplican de inmediato a los talonarios y contratos que se generen.
              </p>
            </div>
            <table className="colecturia-table">
              <thead>
                <tr>
                  <th>Grado</th>
                  <th style={{ textAlign: 'right' }}>Matrícula (USD)</th>
                  <th style={{ textAlign: 'right' }}>Mensualidad (USD)</th>
                </tr>
              </thead>
              <tbody>
                {GRADOS_ARANCEL.map(grado => (
                  <tr key={grado}>
                    <td><span className="student-name">{grado}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={Number.isNaN(aranceles[grado]?.cuotaMatricula) ? '' : aranceles[grado]?.cuotaMatricula ?? ''}
                        onChange={(e) => setArancel(grado, 'cuotaMatricula', e.target.value)}
                        style={{ width: '110px', padding: '0.5rem 0.7rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', textAlign: 'right', fontWeight: 700 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={Number.isNaN(aranceles[grado]?.cuotaMensualidad) ? '' : aranceles[grado]?.cuotaMensualidad ?? ''}
                        onChange={(e) => setArancel(grado, 'cuotaMensualidad', e.target.value)}
                        style={{ width: '110px', padding: '0.5rem 0.7rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', textAlign: 'right', fontWeight: 700 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleGuardarAranceles}
                disabled={guardandoAranceles}
                style={{ padding: '0.9rem 2rem', background: guardandoAranceles ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '1rem', cursor: guardandoAranceles ? 'wait' : 'pointer' }}
              >
                {guardandoAranceles ? 'Guardando…' : 'Guardar Aranceles'}
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA: HISTORIAL DE PAGOS REVISADOS */}
        {tab === 'historial' && (
          <div className="table-container">
            {historial.length === 0 ? (
              <div className="empty-state"><p>Aún no hay pagos revisados.</p></div>
            ) : (
              <table className="colecturia-table">
                <thead>
                  <tr>
                    <th>Carnet</th>
                    <th>Estudiante</th>
                    <th>Grado</th>
                    <th>Origen</th>
                    <th>Estado</th>
                    <th>Revisado</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(row => (
                    <tr key={row.key}>
                      <td><span className="student-name">{row.carnet}</span></td>
                      <td><div className="student-name">{row.studentName}</div></td>
                      <td><span className="amount-badge">{row.grade}</span></td>
                      <td>{badgeTipo(row.tipo)}</td>
                      <td>{badgeEstado(row.receipt.status)}</td>
                      <td>{toDate(row.receipt.reviewedAt)?.toLocaleDateString() || '—'}</td>
                      <td>
                        <a href={row.receipt.fileUrl} target="_blank" rel="noreferrer" className="btn-action-table" style={{ textDecoration: 'none', display: 'inline-block' }}>
                          Ver Archivo
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PESTAÑA: COMPROBANTES PENDIENTES */}
        {tab === 'pendientes' && (
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
        )}

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
