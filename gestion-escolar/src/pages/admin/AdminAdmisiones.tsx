// src/pages/admin/AdminAdmisiones.tsx
import { useState, useEffect } from 'react';
import { admissionService } from '../../services/admissionService';
import { admissionDocumentService } from '../../services/admissionDocumentService';
import { evaluationService } from '../../services/evaluationService';
import type { Admission, AdmissionDocument } from '../../types';

export default function AdminAdmisiones() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de detalles
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [documents, setDocuments] = useState<AdmissionDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Estado para rechazar documentos
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Cargar todas las solicitudes
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

  // 2. Abrir detalles de un aspirante y cargar sus documentos
  const handleOpenDetails = async (admission: Admission) => {
    setSelectedAdmission(admission);
    setLoadingDocs(true);
    try {
      const docs = await admissionDocumentService.getDocumentsForAdmission(admission.id);
      setDocuments(docs);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  // 3. Aprobar Documento
  const handleApproveDoc = async (docId: string) => {
    try {
      await admissionDocumentService.approveDocument(docId, 'Admin_Registro');
      // Actualizar la lista local
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: 'approved' } : d));
    } catch (error) {
      alert("Error al aprobar documento");
    }
  };

  // 4. Rechazar Documento
  const handleRejectDoc = async (docId: string) => {
    if (!rejectReason.trim()) {
      alert("Debes escribir un motivo para el rechazo");
      return;
    }
    try {
      await admissionDocumentService.rejectDocument(docId, 'Admin_Registro', rejectReason);
      setRejectingDocId(null);
      setRejectReason('');
      // Actualizar la lista local
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, status: 'rejected', rejectionReason: rejectReason } : d));
    } catch (error) {
      alert("Error al rechazar documento");
    }
  };

  // 5. Habilitar Evaluaciones (Avanzar a Fase 3)
  const handleHabilitarExamenes = async () => {
    if (!selectedAdmission) return;
    const confirm = window.confirm("¿Estás seguro de habilitar los exámenes para este aspirante? Esto le notificará que puede iniciar sus pruebas.");
    if (!confirm) return;

    try {
      await evaluationService.createEvaluationsForAdmission(
        selectedAdmission.id, 
        `${selectedAdmission.studentFirstName} ${selectedAdmission.studentLastName}`
      );
      alert("¡Exámenes habilitados con éxito!");
      loadAdmissions(); // Recargar lista
      setSelectedAdmission(null); // Cerrar modal
    } catch (error) {
      alert("Error al habilitar exámenes.");
    }
  };

  // Calcular si todos los documentos subidos están aprobados
  const todosAprobados = documents.length > 0 && documents.every(d => d.status === 'approved');

  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#002a4a', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Bandeja de Admisiones</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Gestiona las solicitudes, revisa documentos y habilita exámenes.</p>
        </div>
        <button onClick={loadAdmissions} style={{ padding: '0.8rem 1.5rem', backgroundColor: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔄 Actualizar Lista
        </button>
      </div>

      {/* TABLA DE SOLICITUDES */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Cargando solicitudes...</div>
        ) : admissions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No hay solicitudes de admisión todavía.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.2rem', fontWeight: 600 }}>Aspirante</th>
                <th style={{ padding: '1.2rem', fontWeight: 600 }}>Grado a Cursar</th>
                <th style={{ padding: '1.2rem', fontWeight: 600 }}>Fecha Solicitud</th>
                <th style={{ padding: '1.2rem', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '1.2rem', fontWeight: 600, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map(adm => (
                <tr key={adm.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '1.2rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#002a4a' }}>{adm.studentFirstName} {adm.studentLastName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Resp: {adm.parentFirstName}</div>
                  </td>
                  <td style={{ padding: '1.2rem', color: '#0068B3', fontWeight: 600 }}>{adm.gradeApplying}</td>
                  <td style={{ padding: '1.2rem', color: '#64748b' }}>{new Date(adm.applicationDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1.2rem' }}>
                    <span style={{ 
                      padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: adm.status === 'pending' ? '#fef9c3' : adm.status === 'approved' ? '#dcfce7' : '#e0f2fe',
                      color: adm.status === 'pending' ? '#b45309' : adm.status === 'approved' ? '#166534' : '#0369a1'
                    }}>
                      {adm.status === 'pending' ? 'En Revisión' : adm.status === 'approved' ? 'Admitido' : 'En Proceso'}
                    </span>
                  </td>
                  <td style={{ padding: '1.2rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleOpenDetails(adm)}
                      style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#002a4a', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Revisar Expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE DETALLES Y REVISIÓN DE DOCUMENTOS */}
      {selectedAdmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,42,74,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header del Modal */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#002a4a', color: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Expediente de {selectedAdmission.studentFirstName}</h2>
                <p style={{ margin: '0.2rem 0 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>Grado: {selectedAdmission.gradeApplying}</p>
              </div>
              <button onClick={() => setSelectedAdmission(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>

            {/* Cuerpo del Modal */}
            <div style={{ padding: '2rem' }}>
              <h3 style={{ color: '#008C5A', margin: '0 0 1rem 0' }}>Documentos Subidos por la Familia</h3>
              
              {loadingDocs ? (
                <p>Cargando documentos...</p>
              ) : documents.length === 0 ? (
                <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>La familia aún no ha subido ningún documento.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: doc.status === 'approved' ? '#f0fdf4' : doc.status === 'rejected' ? '#fef2f2' : 'white' }}>
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.3rem 0', color: '#002a4a' }}>{doc.fileName}</h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Tipo: {doc.type}</span>
                          <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', backgroundColor: doc.status === 'pending' || doc.status === 'resubmitted' ? '#fef9c3' : doc.status === 'approved' ? '#dcfce7' : '#fee2e2', color: doc.status === 'pending' || doc.status === 'resubmitted' ? '#b45309' : doc.status === 'approved' ? '#166534' : '#b91c1c' }}>
                            {doc.status === 'pending' ? 'Pendiente' : doc.status === 'resubmitted' ? 'Re-subido' : doc.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </div>
                        {doc.status === 'rejected' && doc.rejectionReason && (
                          <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: '0.5rem 0 0 0' }}>Motivo: {doc.rejectionReason}</p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', color: '#0369a1', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>👁️ Ver Archivo</a>
                        
                        {(doc.status === 'pending' || doc.status === 'resubmitted') && (
                          <>
                            <button onClick={() => handleApproveDoc(doc.id)} style={{ padding: '0.5rem', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Aprobar">✅</button>
                            <button onClick={() => setRejectingDocId(doc.id)} style={{ padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Rechazar">❌</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Cuadro de rechazo emergente */}
                  {rejectingDocId && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', color: '#b91c1c', marginBottom: '0.5rem' }}>Motivo del rechazo:</label>
                      <input 
                        type="text" 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        placeholder="Ej: La imagen está borrosa, suba un PDF legible"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #fca5a5', marginBottom: '1rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleRejectDoc(rejectingDocId)} style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Rechazo</button>
                        <button onClick={() => { setRejectingDocId(null); setRejectReason(''); }} style={{ padding: '0.5rem 1rem', backgroundColor: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Acción Principal */}
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0', textAlign: 'center' }}>
                <h3 style={{ color: '#002a4a', marginBottom: '1rem' }}>Paso Siguiente: Evaluaciones</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Si los documentos están correctos, puedes habilitarle a este aspirante el acceso a sus exámenes (Psicológico, Académico, etc.)
                </p>
                
                <button 
                  onClick={handleHabilitarExamenes}
                  disabled={!todosAprobados}
                  style={{ 
                    padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 800, border: 'none', borderRadius: '8px', width: '100%',
                    backgroundColor: todosAprobados ? '#FAB529' : '#e2e8f0', 
                    color: todosAprobados ? '#002a4a' : '#94a3b8',
                    cursor: todosAprobados ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  {todosAprobados ? '🚀 Habilitar Exámenes de Admisión' : '⚠️ Faltan documentos por aprobar'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}