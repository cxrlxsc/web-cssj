// src/pages/admin/AdminAprobacionMatricula.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admissionService } from '../../services/admissionService';
import { microsoftProvisioningService } from '../../services/microsoftProvisioningService';
import logoImg from '../../assets/logo.png';
import type { Admission } from '../../types';

const VERDE = '#008C5A';
const NAVY = '#002a4a';

type Credenciales = { carnet: string; email: string; password: string; nombre: string };

export default function AdminAprobacionMatricula() {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Credenciales | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await admissionService.getAllAdmissions();
      setAdmissions(data);
    } catch (e) {
      console.error('Error cargando admisiones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAprobar = async (adm: Admission) => {
    const ok = window.confirm(
      `¿Aprobar a ${adm.studentFirstName} ${adm.studentLastName} para matrícula?\n\n` +
      `Se le generará su carnet, correo institucional y contraseña.`
    );
    if (!ok) return;

    setProcessingId(adm.id);
    try {
      const creds = await admissionService.approveForEnrollment(adm, 'Admin_Registro');
      setResultado({
        ...creds,
        nombre: `${adm.studentFirstName} ${adm.studentLastName}`,
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al aprobar al aspirante.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProvisionar = async (adm: Admission) => {
    const ok = window.confirm(
      `¿Crear la cuenta real en Microsoft 365 para ${adm.studentFirstName} ${adm.studentLastName}?\n\n` +
      `Correo: ${adm.assignedCredentials?.microsoftEmail}`
    );
    if (!ok) return;

    setProvisioningId(adm.id);
    try {
      const res = await microsoftProvisioningService.provisionAccount(adm.id);
      alert(
        `Cuenta creada en Microsoft 365.\n\n` +
        `Usuario: ${res.userPrincipalName}\n` +
        `Teams habilitado: ${res.teamsEnabled ? 'Sí' : 'No (sin licencia)'}`
      );
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Error al provisionar la cuenta en Microsoft 365.');
    } finally {
      setProvisioningId(null);
    }
  };

  const copiar = (texto: string) => {
    navigator.clipboard?.writeText(texto).catch(() => {});
  };

  const esFinal = (s: Admission['status']) => s === 'approved' || s === 'enrolled';
  const porAprobar = admissions.filter(a => !esFinal(a.status) && a.status !== 'rejected');
  const aprobados = admissions.filter(a => esFinal(a.status));

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* NAVBAR */}
      <nav style={{ background: VERDE, color: 'white', padding: '0.9rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <img src={logoImg} alt="Logo" style={{ height: '42px' }} />
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
          Cerrar Sesión
        </button>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <Link to="/admin/recursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, marginBottom: '1.5rem' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Volver a Recursos Internos
        </Link>

        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: NAVY, fontSize: '1.8rem' }}>Aprobación y Matrícula</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#64748b' }}>
            Decisión final de admisión. Al aprobar se genera el carnet, correo institucional y contraseña del estudiante.
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando aspirantes...</div>
        ) : (
          <>
            {/* POR APROBAR */}
            <h2 style={{ color: NAVY, fontSize: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              Listos para decisión ({porAprobar.length})
            </h2>
            {porAprobar.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '1rem 0' }}>No hay aspirantes pendientes de aprobación.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
                {porAprobar.map(adm => (
                  <div key={adm.id} style={cardStyle}>
                    <div>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: '1.05rem' }}>
                        {adm.studentFirstName} {adm.studentLastName}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                        {adm.gradeApplying} · Estado: <strong>{traducirEstado(adm.status)}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAprobar(adm)}
                      disabled={processingId === adm.id}
                      style={{ ...btnPrimario, opacity: processingId === adm.id ? 0.6 : 1 }}
                    >
                      {processingId === adm.id ? 'Generando...' : 'Aprobar y Matricular'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* APROBADOS */}
            <h2 style={{ color: NAVY, fontSize: '1.2rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              Aprobados / Matriculados ({aprobados.length})
            </h2>
            {aprobados.length === 0 ? (
              <p style={{ color: '#94a3b8', padding: '1rem 0' }}>Aún no hay estudiantes aprobados.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {aprobados.map(adm => {
                  const cred = adm.assignedCredentials;
                  return (
                    <div key={adm.id} style={{ ...cardStyle, flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem', borderLeft: `5px solid ${VERDE}` }}>
                      <div style={{ fontWeight: 700, color: NAVY, fontSize: '1.05rem' }}>
                        {adm.studentFirstName} {adm.studentLastName}
                        <span style={{ marginLeft: '0.6rem', fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                          {adm.gradeApplying}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                        <CampoCredencial label="Carnet" valor={adm.carnet || cred?.studentCode || '—'} onCopy={copiar} />
                        <CampoCredencial label="Correo (Teams)" valor={cred?.microsoftEmail || '—'} onCopy={copiar} />
                        <CampoCredencial label="Contraseña" valor={cred?.microsoftPassword || '—'} onCopy={copiar} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Microsoft 365:{' '}
                          <strong style={{ color: cred?.provisioningStatus === 'provisioned' ? VERDE : '#b45309' }}>
                            {traducirProvision(cred?.provisioningStatus)}
                          </strong>
                        </span>
                        {cred?.provisioningStatus !== 'provisioned' && (
                          <button
                            onClick={() => handleProvisionar(adm)}
                            disabled={provisioningId === adm.id || !cred?.microsoftEmail}
                            style={{ ...btnSecundario, cursor: provisioningId === adm.id ? 'wait' : 'pointer', opacity: provisioningId === adm.id ? 0.6 : 1 }}
                          >
                            {provisioningId === adm.id ? 'Creando cuenta...' : 'Provisionar en M365'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL DE RESULTADO */}
      {resultado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: VERDE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem' }}>
                <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <h2 style={{ margin: 0, color: NAVY }}>¡Estudiante Aprobado!</h2>
              <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>{resultado.nombre}</p>
            </div>
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <CampoCredencial label="Carnet" valor={resultado.carnet} onCopy={copiar} />
              <CampoCredencial label="Correo institucional (Teams)" valor={resultado.email} onCopy={copiar} />
              <CampoCredencial label="Contraseña temporal" valor={resultado.password} onCopy={copiar} />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '1rem 0 0', textAlign: 'center' }}>
              Guarda o entrega estas credenciales. La cuenta real en Microsoft 365 se crea en el paso de provisión (Fase 2).
            </p>
            <button onClick={() => setResultado(null)} style={{ ...btnPrimario, width: '100%', marginTop: '1.2rem', justifyContent: 'center' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponentes / estilos ----------

function CampoCredencial({ label, valor, onCopy }: { label: string; valor: string; onCopy: (v: string) => void }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.2rem' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: NAVY, wordBreak: 'break-all' }}>{valor}</span>
        {valor && valor !== '—' && (
          <button onClick={() => onCopy(valor)} title="Copiar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', flexShrink: 0 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function traducirEstado(s: Admission['status']): string {
  const map: Record<string, string> = {
    pending: 'En revisión', evaluations: 'En evaluaciones', interview: 'Fase entrevista',
    approved: 'Aprobado', rejected: 'Rechazado', enrolled: 'Matriculado',
  };
  return map[s] || s;
}

function traducirProvision(s?: string): string {
  const map: Record<string, string> = {
    not_started: 'No provisionado', pending: 'En proceso', provisioned: 'Cuenta creada', failed: 'Falló',
  };
  return map[s || 'not_started'] || 'No provisionado';
}

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: '12px', padding: '1.2rem 1.5rem',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', flexWrap: 'wrap',
};

const btnPrimario: React.CSSProperties = {
  background: VERDE, color: 'white', border: 'none', borderRadius: '8px',
  padding: '0.7rem 1.4rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
};

const btnSecundario: React.CSSProperties = {
  background: 'white', color: NAVY, border: `1px solid ${NAVY}`, borderRadius: '8px',
  padding: '0.5rem 1rem', fontWeight: 700,
};
