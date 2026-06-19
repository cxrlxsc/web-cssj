// src/pages/admin/AdminPagosReingreso.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockStudentDB } from '../../data/mockStudent';
import logoImg from '../../assets/logo.png';
import './adminStyles/AdminColecturia.css'; 

export const AdminPagosReingreso = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pagosEnRevision, setPagosEnRevision] = useState<any[]>([]);
  
  // Estado para el modal de vista previa del recibo
  const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  // Función para cargar de la memoria los alumnos que ya subieron su recibo
  const cargarPagos = () => {
    const pagosPendientes = [];
    
    // Recorremos nuestra base de datos falsa
    for (const carnet in mockStudentDB) {
      const estadoPago = localStorage.getItem(`pago_${carnet}`);
      if (estadoPago === 'revision') {
        pagosPendientes.push(mockStudentDB[carnet as keyof typeof mockStudentDB]);
      }
    }
    setPagosEnRevision(pagosPendientes);
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const handleAprobarPago = (carnet: string) => {
    if(window.confirm('¿Confirmar que el dinero ha sido recibido en el banco para este carnet?')) {
      // Guardamos la aprobación en memoria
      localStorage.setItem(`pago_${carnet}`, 'aprobado');
      // Limpiamos la selección y recargamos la lista
      setSelectedAlumno(null);
      cargarPagos();
      alert('Pago aprobado. El contrato se ha habilitado para el alumno.');
    }
  };

  const handleRechazarPago = (carnet: string) => {
    const motivo = window.prompt("Indica el motivo del rechazo (ej. Comprobante ilegible):");
    if (!motivo) return;
    
    // Aquí podrías guardar el rechazo en localStorage si tu lógica lo requiere
    localStorage.setItem(`pago_${carnet}`, 'rechazado');
    setSelectedAlumno(null);
    cargarPagos();
    alert('Pago rechazado y notificado al estudiante.');
  };

  return (
    <div className="admin-colecturia-layout">
      
      {/* NAVBAR VERDE OFICIAL */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="colecturia-main">
        
        {/* ENCABEZADO Y CONTROLES */}
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a Recursos Internos
          </Link>
        </div>

        <header className="colecturia-header">
          <div className="header-titles">
            <h1>Control de Colecturía (Reingreso)</h1>
            <p>Revisión y validación de comprobantes de pago de matrícula cargados por alumnos de reingreso.</p>
          </div>
          <button onClick={cargarPagos} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refrescar Lista
          </button>
        </header>

        {/* TABLA PRINCIPAL */}
        <div className="table-container">
          {pagosEnRevision.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p>No hay comprobantes pendientes de revisión por el momento.</p>
            </div>
          ) : (
            <table className="colecturia-table">
              <thead>
                <tr>
                  <th>Carnet</th>
                  <th>Estudiante</th>
                  <th>Grado Matricular</th>
                  <th>Comprobante</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosEnRevision.map((alumno, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="student-name">{alumno.carnet}</span>
                    </td>
                    <td>
                      <div className="student-name">{alumno.nombres} {alumno.apellidos}</div>
                    </td>
                    <td>
                      <span className="amount-badge">{alumno.gradoMatricular}</span>
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedAlumno(alumno)}
                        className="btn-action-table" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver Archivo Subido
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleAprobarPago(alumno.carnet)} 
                        className="btn-action-table" 
                        style={{ backgroundColor: '#008C5A', color: 'white', borderColor: '#008C5A' }}
                      >
                        Aprobar Pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* =========================================
            MODAL DE REVISIÓN DEL RECIBO BANCARIO
            ========================================= */}
        {selectedAlumno && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              
              <div className="modal-header">
                <div>
                  <h2>Comprobante de Pago</h2>
                  <p>Estudiante: {selectedAlumno.nombres} {selectedAlumno.apellidos}</p>
                </div>
                <button onClick={() => setSelectedAlumno(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                
                {/* Simulador visual de un comprobante (Ya que no hay URLs reales en la db mock) */}
                <div className="receipt-image-container" style={{ backgroundColor: '#f8fafc', padding: '2rem', border: '2px dashed #cbd5e1' }}>
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem auto' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p style={{ fontWeight: 600, margin: '0 0 0.5rem 0' }}>Archivo de Imagen (Simulado)</p>
                    <p style={{ fontSize: '0.85rem' }}>En producción, aquí se mostraría la foto del recibo subido por la familia del Carnet: <strong>{selectedAlumno.carnet}</strong></p>
                  </div>
                </div>
                
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#030405' }}>Grado Matricular: <span style={{ color: '#008C5A' }}>{selectedAlumno.gradoMatricular}</span></h3>

                <div className="modal-actions" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => handleAprobarPago(selectedAlumno.carnet)} className="btn-approve-large">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Validar y Aprobar Pago
                  </button>
                  <button onClick={() => handleRechazarPago(selectedAlumno.carnet)} className="btn-reject-large">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Rechazar Pago
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};