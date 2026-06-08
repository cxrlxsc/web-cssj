// src/pages/admisiones/PortalAspirante.tsx
import { useState, useEffect, useRef, type JSX } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './PortalAspirante.css';

// Servicios
import { accessCodeService } from '../../services/accessCodeService';
import { admissionService } from '../../services/admissionService';
import { admissionDocumentService, getRequiredDocumentsForGrade } from '../../services/admissionDocumentService';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { validateProfilePhoto } from '../../utils/imageValidation';

// Tipos
import type { 
  AccessCode, 
  Admission, 
  AdmissionDocumentType,
  AdmissionDocumentsStatus,
  AdmissionEvaluation
} from '../../types';

// ============================================
// ICONOS SVG PROFESIONALES
// ============================================
const Icons = {
  Check: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Clock: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  AcademicCap: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" /></svg>,
  Document: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Phone: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Upload: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Camera: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Paperclip: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
};

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
  
  // Estados de carga de archivos
  const [uploadingType, setUploadingType] = useState<AdmissionDocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      const docStatus = await admissionDocumentService.getDocumentsStatus(admissionData.id, admissionData.gradeApplying);
      setDocumentsStatus(docStatus);

      const evals = await evaluationService.getEvaluationsForAdmission(admissionData.id);
      setEvaluations(evals);

      await enrollmentService.getEnrollmentByAdmission(admissionData.id);
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

  const handleCameraSelect = (type: AdmissionDocumentType) => {
    setUploadingType(type);
    cameraInputRef.current?.click();
  };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingType || !admission) return;

    setError('');
    
    // ======== NUEVA LÓGICA DE VALIDACIÓN PARA LA FOTO ========
    if (uploadingType === 'recent_photo') {
      const validation = await validateProfilePhoto(file);
      if (!validation.isValid) {
        setError(validation.error || 'Error al validar la imagen');
        setUploadingType(null); // Reseteamos el estado de carga
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        return; // Detenemos la subida
      }
    }
    // =========================================================

    try {
      await admissionDocumentService.uploadDocument(
        admission.id,
        uploadingType,
        file
      );

      await loadPortalData(admission);

    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // ============================================
  // RENDERIZADO DE INTERFAZ
  // ============================================

  const getPortalStatusBadge = () => {
    if (!admission) return null;
    const status = admission.status;
    
    if (status === 'approved') return <span className="badge-status bg-green-premium"><Icons.Check /> Solicitud Aprobada</span>;
    if (status === 'rejected') return <span className="badge-status bg-red-premium"><Icons.X /> No Admitido</span>;
    if (status === 'enrolled') return <span className="badge-status bg-blue-premium"><Icons.AcademicCap /> Matriculado</span>;
    return <span className="badge-status bg-yellow-premium"><Icons.Clock /> En Revisión</span>;
  };

  const requiredDocs = admission ? getRequiredDocumentsForGrade(admission.gradeApplying) : [];

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
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '1.5rem', color: '#002a4a' }}
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

          <div className="stepper-container">
            <div className="stepper-line"></div>
            {[
              { label: 'Registro', active: true },
              { label: 'Documentos', active: !!documentsStatus?.isComplete },
              { label: 'Evaluaciones', active: evaluations.length > 0 && evaluations.every(e => e.status === 'completed') },
              { label: 'Entrevista', active: !!admission?.interviewResolution?.decision },
              { label: 'Resultado', active: !!admission?.finalDecision?.result }
            ].map((s, i) => (
              <div key={i} className={`step-item ${s.active ? 'active' : ''}`}>
                <div className="step-circle">{s.active ? '✓' : i + 1}</div>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MENSAJE DE DOCUMENTOS PENDIENTES */}
        {admission?.status === 'pending' && !documentsStatus?.isComplete && (
          <div className="alert-box info">
            <div style={{ color: '#0284c7', marginTop: '0.2rem' }}><Icons.Document /></div>
            <div>
              <h3 style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>Documentos Pendientes</h3>
              <p style={{ margin: '0.3rem 0 0', color: '#0c4a6e', fontSize: '0.95rem' }}>Para continuar, debes subir los documentos solicitados. Tienes <strong>{documentsStatus?.approved || 0} de {documentsStatus?.totalRequired || requiredDocs.length}</strong> aprobados.</p>
            </div>
          </div>
        )}

        {/* SECCIÓN DINÁMICA DE DOCUMENTOS */}
        <div className="portal-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ color: '#002a4a' }}><Icons.Document /></div>
            <h2 style={{ color: '#002a4a', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Documentos del Expediente</h2>
          </div>
          
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}

          {requiredDocs.map((docConfig) => {
            const uploadedDoc = documentsStatus?.documents.find(d => d.type === docConfig.type);
            
            // Iconos SVG para documentos
            const docIconMap: Record<string, JSX.Element> = {
              'birth_certificate': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
              'previous_grades': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
              'recent_photo': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
              'identification': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3" /></svg>,
              'financial_solvency': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, // Ícono de moneda/dólar
              'grade_certificate': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> // Ícono de certificado
            };

            return (
              <div key={docConfig.type} className="document-card" style={{ borderColor: uploadedDoc?.status === 'approved' ? '#86efac' : uploadedDoc?.status === 'rejected' ? '#fca5a5' : '#e2e8f0', backgroundColor: uploadedDoc?.status === 'approved' ? '#f0fdf4' : uploadedDoc?.status === 'rejected' ? '#fef2f2' : '#f8fafc' }}>
                <div className="doc-info" style={{ flex: 1 }}>
                  <div className="doc-icon" style={{ color: '#0068B3' }}>{docIconMap[docConfig.type] || <Icons.Document />}</div>
                  <div>
                    <h4 style={{ margin: 0, color: '#002a4a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {docConfig.name} 
                      {docConfig.isRequired && <span style={{ color: '#ef4444' }}>*</span>}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{docConfig.description}</p>
                    
                    {/* Detalles del archivo subido */}
                    {uploadedDoc && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Paperclip /> {uploadedDoc.fileName}</span>
                        {uploadedDoc.status === 'pending' && <span style={{ background: '#fef9c3', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>En revisión</span>}
                        {uploadedDoc.status === 'resubmitted' && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Re-enviado</span>}
                        {uploadedDoc.status === 'approved' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Check /> Aprobado</span>}
                        {uploadedDoc.status === 'rejected' && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.X /> Rechazado</span>}
                      </div>
                    )}
                    
                    {/* Motivo de rechazo */}
                    {uploadedDoc?.status === 'rejected' && uploadedDoc.rejectionReason && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#b91c1c', fontStyle: 'italic', backgroundColor: '#fca5a5', padding: '0.5rem', borderRadius: '6px' }}>
                        <strong>Motivo:</strong> {uploadedDoc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botones de subida y cámara */}
                {(!uploadedDoc || uploadedDoc.status === 'rejected') && (
                  <div className="doc-actions">
                    <button 
                      className="btn-upload" 
                      onClick={() => handleFileSelect(docConfig.type)}
                      disabled={uploadingType === docConfig.type}
                      style={{ 
                        backgroundColor: uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3'
                      }}
                    >
                      <Icons.Upload />
                      {uploadingType === docConfig.type ? 'Subiendo...' : uploadedDoc?.status === 'rejected' ? 'Re-subir' : 'Subir Archivo'}
                    </button>

                    <button 
                      className="btn-camera"
                      onClick={() => handleCameraSelect(docConfig.type)}
                      disabled={uploadingType === docConfig.type}
                      style={{ 
                        color: uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3', 
                        border: `1px solid ${uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3'}`
                      }}
                    >
                      <Icons.Camera />
                      Tomar Foto
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Inputs invisibles para manejar archivos y cámara de dispositivo móvil */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
        />
        <input
          type="file"
          ref={cameraInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          capture="environment" // Esto fuerza a abrir la cámara trasera en móviles
          onChange={handleFileUpload}
        />

        {/* INFO DE CONTACTO */}
        <div className="alert-box success" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ color: '#16a34a', marginTop: '0.2rem' }}><Icons.Phone /></div>
          <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>
            ¿Necesitas ayuda? Llámanos al <strong>2486 0800</strong> o escríbenos a <strong>admisiones@salesianosanjose.edu.sv</strong>
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}