// src/pages/admin/AdminAdmisiones.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import { admissionService } from '../../services/admissionService';
import { admissionDocumentService } from '../../services/admissionDocumentService';
import { evaluationService } from '../../services/evaluationService';
import logoImg from '../../assets/logo.png';
import type { Admission, AdmissionDocument, AdmissionDocumentType } from '../../types';
import './adminStyles/AdminAdmisiones.css';

export default function AdminAdmisiones() {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [documents, setDocuments] = useState<AdmissionDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Documentos REQUERIDOS del grado del aspirante seleccionado (para saber cuáles faltan)
  const [tiposRequeridos, setTiposRequeridos] = useState<{ type: AdmissionDocumentType; name: string }[]>([]);

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const data = await admissionService.getAllAdmissions();
      setAdmissions(data);
    } catch (error) {
      console.error("Error cargando admisiones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleOpenDetails = async (admission: Admission) => {
    setSelectedAdmission(admission);
    setLoadingDocs(true);
    try {
      const docs = await admissionDocumentService.getDocumentsForAdmission(admission.id);
      setDocuments(docs);
      // Documentos obligatorios según el grado (para exigirlos todos antes de habilitar exámenes)
      const requeridos = admissionDocumentService
        .getRequiredDocuments(admission.gradeApplying)
        .filter(d => d.isRequired)
        .map(d => ({ type: d.type, name: d.name }));
      setTiposRequeridos(requeridos);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      await admissionDocumentService.approveDocument(docId, 'Admin_Registro');
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: 'approved' } : d));
    } catch (error) {
      alert("Error al aprobar documento");
    }
  };

  const handleRejectDoc = async (docId: string) => {
    if (!rejectReason.trim()) {
      alert("Debes escribir un motivo para el rechazo");
      return;
    }
    try {
      await admissionDocumentService.rejectDocument(docId, 'Admin_Registro', rejectReason);
      setRejectingDocId(null);
      setRejectReason('');
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: 'rejected', rejectionReason: rejectReason } : d));
    } catch (error) {
      alert("Error al rechazar documento");
    }
  };

  const handleHabilitarExamenes = async () => {
    if (!selectedAdmission) return;
    const confirm = window.confirm("¿Estás seguro de habilitar los exámenes para este aspirante? Esto le notificará que puede iniciar sus pruebas.");
    if (!confirm) return;

    try {
      await evaluationService.createEvaluationsForAdmission(
        selectedAdmission.id,
        `${selectedAdmission.studentFirstName} ${selectedAdmission.studentLastName}`,
        selectedAdmission.gradeApplying
      );
      // La solicitud pasa a fase de evaluaciones: así el aspirante ve sus citas en el portal
      await admissionService.updateAdmissionStatus(selectedAdmission.id, 'evaluations', 'Admin_Registro');
      alert("Exámenes habilitados con éxito. El aspirante ya puede ver sus evaluaciones en su portal.");
      loadAdmissions(); 
      setSelectedAdmission(null); 
    } catch (error) {
      alert("Error al habilitar exámenes.");
    }
  };

  // Solo se pueden habilitar exámenes cuando TODOS los documentos requeridos del
  // grado están subidos Y aprobados (no basta con que lo subido esté aprobado).
  const tiposAprobados = new Set(documents.filter(d => d.status === 'approved').map(d => d.type));
  const requeridosFaltantes = tiposRequeridos.filter(req => !tiposAprobados.has(req.type));
  const todosAprobados = tiposRequeridos.length > 0 && requeridosFaltantes.length === 0;

  return (
    <div className="admin-admisiones-layout">
      
      {/* NAVBAR OFICIAL VERDE */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="admisiones-main">
        
        {/* ENCABEZADO Y CONTROLES */}
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a Recursos Internos
          </Link>
        </div>

        <header className="admisiones-header">
          <div className="header-titles">
            <h1>Bandeja de Admisiones</h1>
            <p>Gestiona las solicitudes, revisa documentos y habilita exámenes de nuevo ingreso.</p>
          </div>
          <button onClick={loadAdmissions} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Actualizar Lista
          </button>
        </header>

        {/* TABLA PRINCIPAL */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">Cargando solicitudes...</div>
          ) : admissions.length === 0 ? (
            <div className="empty-state">No hay solicitudes de admisión todavía.</div>
          ) : (
            <table className="admisiones-table">
              <thead>
                <tr>
                  <th>Aspirante</th>
                  <th>Grado a Cursar</th>
                  <th>Fecha Solicitud</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map(adm => (
                  <tr key={adm.id}>
                    <td>
                      <div className="student-name">{adm.studentFirstName} {adm.studentLastName}</div>
                      <div className="parent-name">Resp: {adm.parentFirstName}</div>
                    </td>
                    <td>
                      <span className="grade-badge">{adm.gradeApplying}</span>
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {new Date(adm.applicationDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`status-badge ${adm.status === 'pending' ? 'status-pending' : adm.status === 'approved' ? 'status-approved' : 'status-process'}`}>
                        {adm.status === 'pending' ? 'En Revisión' : adm.status === 'approved' ? 'Admitido' : 'En Proceso'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleOpenDetails(adm)} className="btn-action-table">
                        Revisar Expediente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL ANIMADO DE REVISIÓN */}
        {selectedAdmission && (
          <div className="modal-overlay">
            <div className="modal-content">
              
              <div className="modal-header">
                <div>
                  <h2>Expediente de {selectedAdmission.studentFirstName}</h2>
                  <p>Grado Solicitado: {selectedAdmission.gradeApplying}</p>
                </div>
                <button onClick={() => setSelectedAdmission(null)} className="btn-close-modal">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <h3 className="modal-section-title">Documentos Subidos por la Familia</h3>
                
                {loadingDocs ? (
                  <p>Cargando documentos...</p>
                ) : documents.length === 0 ? (
                  <div className="empty-state" style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '3rem', backgroundColor: '#f8fafc' }}>
                    <svg width="48" height="48" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 1rem auto', display: 'block' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p style={{ margin: 0, fontWeight: 600 }}>La familia aún no ha subido ningún documento.</p>
                  </div>
                ) : (
                  <div className="docs-list">
                    {documents.map(doc => (
                      <div key={doc.id} className={`doc-item ${doc.status === 'approved' ? 'doc-approved' : doc.status === 'rejected' ? 'doc-rejected' : ''}`}>
                        
                        <div className="doc-info">
                          <h4>{doc.fileName}</h4>
                          <div className="doc-meta">
                            <span className="doc-type">{doc.type}</span>
                            <span className={`status-badge ${doc.status === 'pending' || doc.status === 'resubmitted' ? 'status-pending' : doc.status === 'approved' ? 'status-approved' : 'status-rejected'}`} style={{ backgroundColor: doc.status === 'rejected' ? '#fee2e2' : undefined, color: doc.status === 'rejected' ? '#b91c1c' : undefined, border: doc.status === 'rejected' ? '1px solid #fca5a5' : undefined }}>
                              {doc.status === 'pending' ? 'Pendiente' : doc.status === 'resubmitted' ? 'Re-subido' : doc.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </span>
                          </div>
                          {doc.status === 'rejected' && doc.rejectionReason && (
                            <p className="doc-reason">Motivo de rechazo: {doc.rejectionReason}</p>
                          )}
                        </div>

                        <div className="doc-actions">
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn-doc-view">
                            Ver Archivo
                          </a>
                          
                          {(doc.status === 'pending' || doc.status === 'resubmitted') && (
                            <>
                              <button onClick={() => handleApproveDoc(doc.id)} className="btn-icon-action btn-approve" title="Aprobar Documento">
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              </button>
                              <button onClick={() => setRejectingDocId(doc.id)} className="btn-icon-action btn-reject" title="Rechazar Documento">
                                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Caja de Rechazo */}
                    {rejectingDocId && (
                      <div className="reject-box">
                        <label>Indique el motivo del rechazo:</label>
                        <input 
                          type="text" 
                          className="reject-input"
                          value={rejectReason} 
                          onChange={(e) => setRejectReason(e.target.value)} 
                          placeholder="Ej: El documento está borroso, por favor suba un PDF legible."
                        />
                        <div className="doc-actions">
                          <button onClick={() => handleRejectDoc(rejectingDocId)} className="btn-icon-action btn-reject" style={{ width: 'auto', padding: '0 1.5rem', fontWeight: '800' }}>
                            Confirmar Rechazo
                          </button>
                          <button onClick={() => { setRejectingDocId(null); setRejectReason(''); }} className="btn-back" style={{ border: 'none', background: 'transparent' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Acción Final */}
                <div className="modal-footer-action">
                  <h3>Paso Siguiente: Evaluaciones de Admisión</h3>
                  <p>Si el expediente documental está completo y aprobado, habilita el acceso a las pruebas.</p>

                  {/* Lista de documentos requeridos que aún faltan por aprobar */}
                  {!loadingDocs && requeridosFaltantes.length > 0 && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.9rem 1.1rem', margin: '0 0 1rem 0', textAlign: 'left' }}>
                      <strong style={{ color: '#92400e', fontSize: '0.88rem' }}>Faltan por aprobar (obligatorios de {selectedAdmission.gradeApplying}):</strong>
                      <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.3rem', color: '#a16207', fontSize: '0.85rem' }}>
                        {requeridosFaltantes.map(req => <li key={req.type}>{req.name}</li>)}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleHabilitarExamenes}
                    disabled={!todosAprobados}
                    className={`btn-primary-action ${todosAprobados ? 'active' : 'disabled'}`}
                  >
                    {todosAprobados ? (
                      <>
                        Habilitar Exámenes de Ingreso
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                      </>
                    ) : (
                      <>
                        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Faltan documentos por aprobar
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}