// src/pages/admin/AdminContratosFirmados.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './adminStyles/AdminContratosFirmados.css';

export default function AdminContratosFirmados() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  // Simulación de carga desde la Base de Datos
  const loadContratos = async () => {
    setLoading(true);
    try {
      // AQUÍ IRÁ TU LÓGICA DE FIREBASE (ej. getDocs(collection(db, 'contratos_subidos')))
      // Por ahora simulamos la bandeja de entrada:
      const mockData = [
        {
          id: '1', 
          carnet: '2026-001', 
          estudianteNombre: 'CARLOS DANIEL GARCÍA LÓPEZ', 
          responsableNombre: 'MILTON GEOVANNI ERAZO ACOSTA',
          grado: 'PREPARATORIA', 
          fechaEnvio: '2026-01-05T10:30:00', 
          status: 'pending',
          // Simulamos un PDF o imagen subida por el padre
          documentoUrl: 'https://via.placeholder.com/600x800?text=Contrato+Firmado+Escaneado.pdf'
        },
        {
          id: '2', 
          carnet: '2026-002', 
          estudianteNombre: 'LIDIA QUIJADA', 
          responsableNombre: 'María Quijada',
          grado: '2° BACHILLERATO', 
          fechaEnvio: '2026-01-04T14:15:00', 
          status: 'approved',
          documentoUrl: 'https://via.placeholder.com/600x800?text=Contrato+Aprobado.pdf'
        }
      ];
      setContratos(mockData);
    } catch (error) {
      console.error("Error cargando contratos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadContratos(); 
  }, []);

  const handleAprobarContrato = async (id: string) => {
    const confirm = window.confirm("¿Confirmas que el contrato tiene las firmas correctas y es válido legalmente? Esto matriculará oficialmente al alumno en el sistema.");
    if (!confirm) return;
    
    try {
      // AQUÍ ACTUALIZAS EN FIREBASE (ej. updateDoc(doc(db, 'contratos', id), { status: 'approved' }))
      
      // Actualizamos el estado local para reflejar el cambio de inmediato
      setContratos(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
      setSelectedDoc(null);
      
      alert("¡Expediente legal aprobado con éxito!\n\nEl alumno ha sido matriculado oficialmente y se ha enviado una alerta de confirmación a la familia.");
    } catch (error) {
      alert("Error al intentar aprobar el contrato en la base de datos.");
    }
  };

  const handleRechazarContrato = async (id: string) => {
    const motivo = window.prompt("Indica el motivo exacto por el que rechazas el contrato.\nEste mensaje se enviará como alerta a la familia (Ej: 'Falta la firma de la madre', 'Documento borroso o incompleto'):");
    
    // Si el administrador cancela el prompt o lo deja vacío, detenemos la acción
    if (!motivo || motivo.trim() === '') {
      alert("Operación cancelada. Debes escribir un motivo para poder rechazar el documento.");
      return;
    }
    
    try {
      // AQUÍ ACTUALIZAS EN FIREBASE (ej. updateDoc(doc(db, 'contratos', id), { status: 'rejected', motivoRechazo: motivo }))
      
      // Actualizamos el estado local
      setContratos(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', motivoRechazo: motivo } : c));
      setSelectedDoc(null);
      
      alert(`Contrato devuelto correctamente.\n\nSe ha enviado la siguiente alerta a la familia:\n"${motivo}"`);
    } catch (error) {
      alert("Error al intentar rechazar el contrato en la base de datos.");
    }
  };

  return (
    <div className="contratos-firmados-layout">
      
      {/* NAVBAR VERDE OFICIAL */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="contratos-main">
        
        {/* BOTÓN DE VOLVER */}
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver a Recursos Internos
          </Link>
        </div>

        {/* ENCABEZADO */}
        <header className="contratos-header">
          <div className="header-titles">
            <h1>Auditoría de Contratos Firmados</h1>
            <p>Verifica las firmas y validez legal de los documentos subidos por las familias para concretar la matrícula.</p>
          </div>
          <button onClick={loadContratos} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Refrescar Bandeja
          </button>
        </header>

        {/* TABLA PRINCIPAL */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <p>Cargando documentos legales...</p>
            </div>
          ) : contratos.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <p>No hay contratos pendientes de auditoría por el momento.</p>
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
                {contratos.map((doc, idx) => (
                  <tr key={doc.id || idx}>
                    <td>
                      <div className="student-name">{doc.estudianteNombre}</div>
                      <div className="parent-name">Resp: {doc.responsableNombre}</div>
                    </td>
                    <td>
                      <span style={{ color: '#0068B3', fontWeight: '700' }}>{doc.grado}</span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(doc.fechaEnvio).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${doc.status === 'pending' ? 'status-pending' : doc.status === 'approved' ? 'status-approved' : 'status-rejected'}`}>
                        {doc.status === 'pending' ? 'En Auditoría' : doc.status === 'approved' ? 'Matriculado' : 'Devuelto'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setSelectedDoc(doc)} className="btn-action-table">
                        Auditar Documento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* =========================================
            MODAL DE AUDITORÍA LEGAL
            ========================================= */}
        {selectedDoc && (
          <div className="modal-overlay">
            <div className="modal-content">
              
              <div className="modal-header">
                <div>
                  <h2>Contrato de Servicios Educativos</h2>
                  <p>Aspirante: {selectedDoc.estudianteNombre} | Carnet: {selectedDoc.carnet}</p>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="modal-body">
                
                {/* Visualizador del Documento */}
                <div className="document-preview">
                  <img src={selectedDoc.documentoUrl} alt="Vista previa del contrato escaneado" />
                </div>
                
                {/* Controles de Decisión (Solo visibles si está pendiente) */}
                {selectedDoc.status === 'pending' && (
                  <div className="modal-actions">
                    <button onClick={() => handleAprobarContrato(selectedDoc.id)} className="btn-approve-large">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Aprobar y Matricular Oficialmente
                    </button>
                    <button onClick={() => handleRechazarContrato(selectedDoc.id)} className="btn-reject-large">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Devolver por Errores / Falta de Firma
                    </button>
                  </div>
                )}

                {/* Mensaje de Estado (Si ya fue auditado) */}
                {selectedDoc.status !== 'pending' && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: selectedDoc.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: '8px', border: `1px solid ${selectedDoc.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>
                    <p style={{ margin: 0, color: '#030405', fontSize: '1.1rem' }}>
                      Este expediente ya fue auditado y se encuentra en estado: <span style={{ fontWeight: '800', color: selectedDoc.status === 'approved' ? '#15803d' : '#b91c1c' }}>{selectedDoc.status === 'approved' ? 'APROBADO (MATRICULADO)' : 'DEVUELTO A LA FAMILIA'}</span>.
                    </p>
                    {selectedDoc.status === 'rejected' && selectedDoc.motivoRechazo && (
                      <p style={{ marginTop: '0.5rem', color: '#b91c1c', fontSize: '0.95rem' }}>
                        <strong>Motivo enviado:</strong> {selectedDoc.motivoRechazo}
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}