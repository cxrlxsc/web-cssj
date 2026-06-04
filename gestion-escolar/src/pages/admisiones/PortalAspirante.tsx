// src/pages/admisiones/PortalAspirante.tsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './PortalAspirante.css';

// Servicios
import { accessCodeService } from '../../services/accessCodeService';
import { admissionService } from '../../services/admissionService';
import { admissionDocumentService, getRequiredDocumentsForGrade } from '../../services/admissionDocumentService';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';

// Tipos
import type { 
  AccessCode, 
  Admission, 
  AdmissionDocumentType,
  AdmissionDocumentsStatus,
  AdmissionEvaluation,
  EnrollmentData
} from '../../types';

export default function PortalAspirante() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [step, setStep] = useState<'enter-code' | 'portal'>(initialCode ? 'portal' : 'enter-code');
  const [codeInput, setCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<AdmissionDocumentsStatus | null>(null);
  const [evaluations, setEvaluations] = useState<AdmissionEvaluation[]>([]);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);

  // Estados de carga de archivos
  const [uploadingType, setUploadingType] = useState<AdmissionDocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // LÓGICA DE CARGA DE DATOS
  // ============================================

  useEffect(() => {
    if (initialCode) {
      handleCheckCode(initialCode);
    }
  }, [initialCode]);

  const loadPortalData = async (admissionData: Admission) => {
    try {
      // Cargar estatus de documentos
      const docStatus = await admissionDocumentService.getDocumentsStatus(admissionData.id, admissionData.gradeApplying);
      setDocumentsStatus(docStatus);

      // Cargar evaluaciones
      const evals = await evaluationService.getEvaluationsForAdmission(admissionData.id);
      setEvaluations(evals);

      // Cargar matrícula
      const enrollmentData = await enrollmentService.getEnrollmentByAdmission(admissionData.id);
      setEnrollment(enrollmentData);

    } catch (e) {
      console.error("Error cargando los detalles del portal:", e);
    }
  };

  const handleCheckCode = async (codeToVerify?: string) => {
    const code = codeToVerify || codeInput;
    if (!code.trim()) {
      setError('Ingresa tu código de acceso');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const codeData = await accessCodeService.getCodeByValue(code.toUpperCase().trim());
      if (!codeData) {
        setError('Código no válido o no encontrado');
        setLoading(false);
        return;
      }
      setAccessCode(codeData);

      const admissions = await admissionService.getAdmissionsByAccessCode(codeData.code);
      if (admissions.length === 0) {
        setError('No hay ninguna solicitud asociada a este código.');
        setLoading(false);
        return;
      }

      // Tomar la solicitud más reciente
      const latestAdmission = admissions.sort((a, b) => 
        new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
      )[0];
      
      setAdmission(latestAdmission);
      await loadPortalData(latestAdmission);
      
      setStep('portal');
    } catch (err: any) {
      setError('Error al conectar con el sistema. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LÓGICA DE SUBIDA DE ARCHIVOS
  // ============================================

  const handleFileSelect = (type: AdmissionDocumentType) => {
    setUploadingType(type);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingType || !admission) return;

    setError('');
    
    // Mostramos un alert simple por ahora mientras sube el archivo
    alert(`Subiendo documento: ${file.name}... Por favor, espere.`);

    try {
      await admissionDocumentService.uploadDocument(
        admission.id,
        uploadingType,
        file
      );

      alert('¡Documento subido con éxito!');
      
      // Refrescar los datos para ver el nuevo badge
      await loadPortalData(admission);

    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
      alert(`Error al subir: ${err.message}`);
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ============================================
  // RENDERIZADO DE INTERFAZ
  // ============================================

  const getPortalStatusBadge = () => {
    if (!admission) return null;
    const status = admission.status;
    
    if (status === 'approved') return <span className="badge-status bg-green-premium">✅ Solicitud Aprobada</span>;
    if (status === 'rejected') return <span className="badge-status bg-red-premium">❌ No Admitido</span>;
    if (status === 'enrolled') return <span className="badge-status bg-blue-premium">🎓 Estudiante Matriculado</span>;
    return <span className="badge-status bg-yellow-premium">⏳ En Revisión</span>;
  };

  // Obtener la lista dinámica de documentos requeridos para el grado seleccionado
  const requiredDocs = admission ? getRequiredDocumentsForGrade(admission.gradeApplying) : [];

  // VISTA 1: INGRESO DE CÓDIGO
  if (step === 'enter-code') {
    return (
      <div className="portal-page">
        <Navbar />
        <section className="hero-portal">
          <h1 className="titulo-portal">Mi Solicitud</h1>
          <p>Consulta el avance de tu proceso de admisión</p>
        </section>

        <section className="portal-container">
          <div className="portal-card" style={{ maxWidth: '500px', margin: '-140px auto 0', textAlign: 'center' }}>
            <div className="code-icon" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#002a4a' }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
            </div>
            <h2 style={{ color: '#002a4a', fontWeight: 800, marginBottom: '1rem' }}>Ingresa tu Código</h2>
            <input 
              type="text" 
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '1.5rem' }}
              placeholder="CSSJ-XXXX" 
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            />
            {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}
            <button 
              style={{ width: '100%', padding: '1rem', background: '#008C5A', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }} 
              onClick={() => handleCheckCode()} 
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Acceder al Portal'}
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // VISTA 2: PANEL DEL ASPIRANTE
  return (
    <div className="portal-page">
      <Navbar />
      
      <section className="hero-portal">
        <span className="badge-premium" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.3)' }}>
          Expediente Digital
        </span>
        <h1 className="titulo-portal">Hola, {admission?.studentFirstName}</h1>
        <p>Aspirante a: <strong style={{ color: '#FAB529' }}>{admission?.gradeApplying}</strong></p>
      </section>

      <main className="portal-container">
        
        {/* TARJETA DE ESTADO Y PROGRESO */}
        <div className="portal-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ color: '#002a4a', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Estado de tu Solicitud</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Código de seguimiento: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{accessCode?.code}</span></p>
            </div>
            {getPortalStatusBadge()}
          </div>

          {/* Stepper (Barra de progreso visual) */}
          <div className="stepper-container">
            <div className="stepper-line"></div>
            {[
              { label: 'Registro', active: true },
              { label: 'Documentos', active: !!documentsStatus?.isComplete },
              { label: 'Evaluaciones', active: evaluations.length > 0 && evaluations.every(e => e.status === 'completed') },
              { label: 'Entrevista', active: admission?.interviewResolution?.decision ? true : false },
              { label: 'Resultado', active: admission?.finalDecision?.result ? true : false }
            ].map((s, i) => (
              <div key={i} className={`step-item ${s.active ? 'active' : ''}`}>
                <div className="step-circle">{s.active ? '✓' : i + 1}</div>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MENSAJE DE BIENVENIDA O ADVERTENCIA */}
        {admission?.status === 'pending' && !documentsStatus?.isComplete && (
          <div className="alert-box info">
            <span style={{ fontSize: '1.5rem' }}>📄</span>
            <div>
              <h3 style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>Documentos Pendientes</h3>
              <p style={{ margin: '0.3rem 0 0', color: '#0c4a6e' }}>Para continuar, debes subir los documentos solicitados. Tienes <strong>{documentsStatus?.approved || 0} de {documentsStatus?.totalRequired || requiredDocs.length}</strong> aprobados.</p>
            </div>
          </div>
        )}

        {/* SECCIÓN DINÁMICA DE DOCUMENTOS */}
        <div className="portal-card">
          <h2 style={{ color: '#002a4a', fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>📁 Documentos del Expediente</h2>
          
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}

          {requiredDocs.map((docConfig) => {
            // Buscar si este documento ya fue subido
            const uploadedDoc = documentsStatus?.documents.find(d => d.type === docConfig.type);
            
            // Iconos por defecto
            const iconMap: Record<string, string> = {
              'birth_certificate': '📜',
              'previous_grades': '📊',
              'recent_photo': '📷',
              'identification': '🪪',
              'vaccination_card': '💉',
              'other': '📄'
            };

            return (
              <div key={docConfig.type} className="document-card" style={{ borderColor: uploadedDoc?.status === 'approved' ? '#86efac' : uploadedDoc?.status === 'rejected' ? '#fca5a5' : '#e2e8f0', backgroundColor: uploadedDoc?.status === 'approved' ? '#f0fdf4' : uploadedDoc?.status === 'rejected' ? '#fef2f2' : '#f8fafc' }}>
                <div className="doc-info">
                  <div className="doc-icon">{iconMap[docConfig.type] || '📄'}</div>
                  <div>
                    <h4 style={{ margin: 0, color: '#002a4a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {docConfig.name} 
                      {docConfig.isRequired && <span style={{ color: '#ef4444' }}>*</span>}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>{docConfig.description}</p>
                    
                    {/* Detalles del archivo subido */}
                    {uploadedDoc && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#0369a1' }}>📎 {uploadedDoc.fileName}</span>
                        {uploadedDoc.status === 'pending' && <span style={{ background: '#fef9c3', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>En revisión</span>}
                        {uploadedDoc.status === 'resubmitted' && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Re-enviado</span>}
                        {uploadedDoc.status === 'approved' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Aprobado</span>}
                        {uploadedDoc.status === 'rejected' && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Rechazado</span>}
                      </div>
                    )}
                    
                    {/* Motivo de rechazo */}
                    {uploadedDoc?.status === 'rejected' && uploadedDoc.rejectionReason && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#b91c1c', fontStyle: 'italic' }}>
                        <strong>Motivo:</strong> {uploadedDoc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botón de subida (Se oculta si ya está aprobado o en revisión) */}
                {(!uploadedDoc || uploadedDoc.status === 'rejected') && (
                  <button 
                    className="btn-upload" 
                    onClick={() => handleFileSelect(docConfig.type)}
                    disabled={uploadingType === docConfig.type}
                    style={{ backgroundColor: uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3' }}
                  >
                    {uploadingType === docConfig.type ? 'Subiendo...' : uploadedDoc?.status === 'rejected' ? 'Re-subir Archivo' : 'Subir Archivo'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Input invisible para manejar el archivo de React */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
        />

        {/* INFO DE CONTACTO */}
        <div className="alert-box success" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '1.2rem' }}>📞</span>
          <p style={{ margin: 0, color: '#166534', fontSize: '0.9rem' }}>
            ¿Necesitas ayuda? Llámanos al <strong>2440-0000</strong> o escríbenos a <strong>admisiones@salesianosanjose.edu.sv</strong>
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}