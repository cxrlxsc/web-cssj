// src/pages/admisiones/PortalAspirante.tsx
import { useState, useEffect, useRef, type JSX } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ExpedienteModal from './ExpedienteModal'; // <-- IMPORTAMOS EL MODAL
import './PortalAspirante.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Servicios
import { accessCodeService } from '../../services/accessCodeService';
import { admissionService } from '../../services/admissionService';
import { admissionDocumentService, getRequiredDocumentsForGrade } from '../../services/admissionDocumentService';
import { admissionFinanceService } from '../../services/admissionFinanceService';
import { evaluationService } from '../../services/evaluationService';
import { enrollmentService } from '../../services/enrollmentService';
import { validateProfilePhoto } from '../../utils/imageValidation';
import { compressImage } from '../../utils/imageCompression';

// Tipos
import type { 
  AccessCode, 
  Admission, 
  AdmissionDocumentType,
  AdmissionDocumentsStatus,
  AdmissionEvaluation
} from '../../types';

// Tipos locales para Matrícula
type ComprobanteEstado = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';
type ContratoEstado = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';

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
  Paperclip: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  Calendar: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  ClipboardList: () => <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
};

export default function PortalAspirante() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [step, setStep] = useState<'enter-code' | 'portal'>(initialCode ? 'portal' : 'enter-code');
  const [codeInput, setCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data de Admisión
  const [accessCode, setAccessCode] = useState<AccessCode | null>(null);
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<AdmissionDocumentsStatus | null>(null);
  const [evaluations, setEvaluations] = useState<AdmissionEvaluation[]>([]);
  
  // Estados de carga de archivos (Admisión)
  const [uploadingType, setUploadingType] = useState<AdmissionDocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estados y Refs para Fase de Matrícula
  const [expedienteCompletado, setExpedienteCompletado] = useState(false);
  const [showExpedienteModal, setShowExpedienteModal] = useState(false);

  const [talonarioGenerado, setTalonarioGenerado] = useState(false);
  const [estadoComprobante, setEstadoComprobante] = useState<ComprobanteEstado>('pendiente');
  const [isUploadingPago, setIsUploadingPago] = useState(false);
  
  const [estadoContrato, setEstadoContrato] = useState<ContratoEstado>('pendiente');
  const [isUploadingContrato, setIsUploadingContrato] = useState(false);

  const fileInputRefPago = useRef<HTMLInputElement>(null);
  const contratoInputRef = useRef<HTMLInputElement>(null);

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

      // Cargar los estados guardados
      const expGuardado = localStorage.getItem(`expediente_${admissionData.id}`);
      if (expGuardado) setExpedienteCompletado(true);

      // Estado del pago y contrato: real, desde el documento de la admisión.
      const mapEstado = (s?: string): ComprobanteEstado =>
        s === 'approved' ? 'aprobado' : s === 'rejected' ? 'rechazado' : s === 'pending' ? 'revision' : 'pendiente';
      setEstadoComprobante(mapEstado(admissionData.paymentReceipt?.status));
      setEstadoContrato(mapEstado(admissionData.signedContract?.status));
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

      // PARA PRUEBAS: Puedes comentar o descomentar esto para forzar estado aprobado
      // latestAdmission.status = 'approved';

      setAdmission(latestAdmission);
      await loadPortalData(latestAdmission);
      
      setStep('portal');
    } catch (err: any) {
      setError('Error al conectar con el sistema. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
    
    if (uploadingType === 'recent_photo') {
      const validation = await validateProfilePhoto(file);
      if (!validation.isValid) {
        setError(validation.error || 'Error al validar la imagen');
        setUploadingType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        return; 
      }
    }

    try {
      // Comprimimos las imágenes antes de subir (los PDF pasan sin cambios).
      const fileToUpload = await compressImage(file);
      await admissionDocumentService.uploadDocument(admission.id, uploadingType, fileToUpload);
      await loadPortalData(admission);
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Función para guardar Expediente
const handleGuardarExpediente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 1. Capturamos todos los datos del formulario
    const formData = new FormData(e.currentTarget);
    const datosCompletos = Object.fromEntries(formData.entries());
    
    // 2. Preparamos el resumen para el contrato
    const datosContrato = {
      nombre: formData.get('sostenedor_nombre'),
      direccion: formData.get('sostenedor_direccion'),
      dui: formData.get('sostenedor_dui'),
      nit: formData.get('sostenedor_nit'),
      telefono: formData.get('sostenedor_telefono'),
      profesion: formData.get('sostenedor_profesion'),
      parentesco: formData.get('sostenedor_parentesco'),
    };

    try {
      if (!admission) throw new Error("No hay admisión seleccionada");

      // 3. ENVIAMOS A FIREBASE
      const admissionRef = doc(db, 'admissions', admission.id);
      await updateDoc(admissionRef, {
        expedienteDigital: datosCompletos,
        datosSostenedor: datosContrato,
        expedienteCompletado: true // Marcamos como completado en la BD
      });

      // 4. Guardamos localmente el estado de completado
      localStorage.setItem(`expediente_${admission.id}`, 'true');

      // 5. Refrescamos la admisión en memoria para que al reabrir "revisar datos"
      //    el modal muestre lo que se acaba de guardar (sin recargar la página)
      setAdmission({
        ...(admission as any),
        expedienteDigital: datosCompletos,
        datosSostenedor: datosContrato,
        expedienteCompletado: true,
      });

      setExpedienteCompletado(true);
      setShowExpedienteModal(false);
      alert("¡Expediente guardado exitosamente en el sistema!");

    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Ocurrió un error al guardar. Por favor, intenta de nuevo.");
    }
  };

  const handleGenerarTalonario = () => {
    setTalonarioGenerado(true);
    const params = new URLSearchParams({
      source: 'nuevo_ingreso',
      nombre: admission?.studentFirstName || '',
      apellido: admission?.studentLastName || '',
      grado: admission?.gradeApplying || '',
      // Si el aspirante ya fue aprobado, el NPE usa su carnet institucional (8 dígitos);
      // si aún no, cae al código de acceso como identificador temporal.
      codigo: admission?.carnet || accessCode?.code || 'N/A'
    }).toString();
    window.open(`/reingreso/talonario?${params}`, '_blank');
  };

  const handleFileChangePago = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !admission) return;
    setError('');
    setIsUploadingPago(true);
    try {
      const compressed = await compressImage(file);
      const receipt = await admissionFinanceService.uploadPaymentReceipt(admission.id, compressed);
      setAdmission(prev => (prev ? { ...prev, paymentReceipt: receipt } : prev));
      setEstadoComprobante('revision');
    } catch (err: any) {
      setError(err?.message || 'Error al subir el comprobante.');
    } finally {
      setIsUploadingPago(false);
      if (fileInputRefPago.current) fileInputRefPago.current.value = '';
    }
  };

  const handleGenerarContrato = () => {
    const params = new URLSearchParams({
      source: 'nuevo_ingreso',
      nombre: admission?.studentFirstName || '',
      apellido: admission?.studentLastName || '',
      grado: admission?.gradeApplying || '',
      id: admission?.id || '' 
    }).toString();
    navigate(`/imprimir-contrato?${params}`);
  };

  const handleContratoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !admission) return;
    setError('');
    setIsUploadingContrato(true);
    try {
      const compressed = await compressImage(file);
      const contract = await admissionFinanceService.uploadSignedContract(admission.id, compressed);
      setAdmission(prev => (prev ? { ...prev, signedContract: contract } : prev));
      setEstadoContrato('revision');
    } catch (err: any) {
      setError(err?.message || 'Error al subir el contrato.');
    } finally {
      setIsUploadingContrato(false);
      if (contratoInputRef.current) contratoInputRef.current.value = '';
    }
  };

  const getPortalStatusBadge = () => {
    if (!admission) return null;
    const status = admission.status;
    
    if (status === 'approved') return <span className="badge-status bg-green-premium"><Icons.Check /> Solicitud Aprobada</span>;
    if (status === 'rejected') return <span className="badge-status bg-red-premium"><Icons.X /> No Admitido</span>;
    if (status === 'enrolled') return <span className="badge-status bg-blue-premium"><Icons.AcademicCap /> Matriculado Oficialmente</span>;
    if (status === 'evaluations') return <span className="badge-status" style={{ background: '#e0f2fe', color: '#0369a1' }}><Icons.Clock /> En Evaluaciones</span>;
    if (status === 'interview') return <span className="badge-status" style={{ background: '#fef3c7', color: '#d97706' }}><Icons.Clock /> Fase Entrevista</span>;
    
    return <span className="badge-status bg-yellow-premium"><Icons.Clock /> En Revisión</span>;
  };

  const getStepIndex = () => {
    if (!admission) return 0;
    switch (admission.status) {
      case 'enrolled':
      case 'approved': return 5;
      case 'interview': return 4;
      case 'evaluations': return 3;
      case 'pending': return 2;
      case 'rejected': return 5;
      default: return 1;
    }
  };

  const formatearFecha = (fecha?: Date) => {
    if (!fecha) return 'Fecha por definir';
    return new Intl.DateTimeFormat('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(fecha);
  };

  const requiredDocs = admission ? getRequiredDocumentsForGrade(admission.gradeApplying) : [];
  const currentStepIndex = getStepIndex();
  const isApprovedForEnrollment = admission?.status === 'approved' || admission?.status === 'enrolled';

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

  const evalAcademica = evaluations.find(e => e.phaseType === 'academic');
  const evalPsicologica = evaluations.find(e => e.phaseType === 'psychological');
  const evalEntrevista = evaluations.find(e => e.phaseType === 'psychological_interview' || e.phaseType === 'interview');

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

      <main className="portal-container" style={{ paddingBottom: '4rem' }}>
        
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
              { label: 'Registro' },
              { label: 'Documentos' },
              { label: 'Evaluaciones' },
              { label: 'Entrevista' },
              { label: 'Resultado' }
            ].map((s, i) => (
              <div key={i} className={`step-item ${currentStepIndex > i ? 'active' : ''}`}>
                <div className="step-circle">{currentStepIndex > i ? '✓' : i + 1}</div>
                <span className="step-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================
            RENDERIZADO CONDICIONAL POR FASES
            ========================================================= */}
        {isApprovedForEnrollment ? (
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="alert-box success" style={{ background: '#dcfce7', border: '1px solid #86efac', marginBottom: '0.5rem' }}>
              <div style={{ color: '#16a34a', marginTop: '0.2rem' }}><Icons.Check /></div>
              <div>
                <h3 style={{ margin: 0, color: '#166534', fontWeight: 800, fontSize: '1.2rem' }}>¡Felicidades! Has sido admitido/a</h3>
                <p style={{ margin: '0.3rem 0 0', color: '#15803d', fontSize: '0.95rem' }}>Tu proceso de admisión ha concluido con éxito. Ahora debes completar los siguientes pasos para oficializar tu matrícula en la institución.</p>
              </div>
            </div>

            {/* PASO 1: COMPLETAR EXPEDIENTE ESTUDIANTIL */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: expedienteCompletado ? '5px solid #22c55e' : '5px solid #002a4a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: expedienteCompletado ? '#dcfce7' : '#e0e7ff', padding: '1rem', borderRadius: '50%', color: expedienteCompletado ? '#16a34a' : '#3730a3' }}>
                  {expedienteCompletado ? <Icons.Check /> : <Icons.ClipboardList />}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: '#0f172a' }}>1. Ficha de Expediente General</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Completa los datos familiares, transporte y facturación necesarios para tu contrato.</p>
                  {expedienteCompletado && <div style={{ marginTop: '0.5rem' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Expediente Guardado Exitosamente</span></div>}
                </div>
              </div>
              <button onClick={() => setShowExpedienteModal(true)} style={{ padding: '0.8rem 1.5rem', background: expedienteCompletado ? '#f1f5f9' : '#002a4a', color: expedienteCompletado ? '#475569' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {expedienteCompletado ? 'Revisar Datos' : 'Llenar Formulario'}
              </button>
            </div>

            {/* PASO 2: TALONARIO */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: expedienteCompletado ? '5px solid #FAB529' : '5px solid #e2e8f0', opacity: expedienteCompletado ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: expedienteCompletado ? '#fef3c7' : '#f1f5f9', padding: '1rem', borderRadius: '50%', color: expedienteCompletado ? '#d97706' : '#94a3b8' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: expedienteCompletado ? '#0f172a' : '#64748b' }}>2. Generar Talonario</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{expedienteCompletado ? 'Descarga tu talonario para realizar el pago de matrícula y primera colegiatura.' : 'Completa el paso 1 para habilitar tu talonario.'}</p>
                </div>
              </div>
              <button onClick={handleGenerarTalonario} disabled={!expedienteCompletado} style={{ padding: '0.8rem 1.5rem', background: talonarioGenerado ? '#f1f5f9' : (expedienteCompletado ? '#0068B3' : '#cbd5e1'), color: talonarioGenerado ? '#475569' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: expedienteCompletado ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                {talonarioGenerado ? 'Descargar de nuevo' : 'Descargar PDF'}
              </button>
            </div>

            {/* PASO 3: COMPROBANTE PAGO */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoComprobante === 'aprobado' ? '5px solid #22c55e' : (expedienteCompletado ? '5px solid #0068B3' : '5px solid #e2e8f0'), opacity: expedienteCompletado ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: estadoComprobante === 'aprobado' ? '#dcfce7' : (expedienteCompletado ? '#e0f2fe' : '#f1f5f9'), padding: '1rem', borderRadius: '50%', color: estadoComprobante === 'aprobado' ? '#16a34a' : (expedienteCompletado ? '#0284c7' : '#94a3b8') }}>
                  {estadoComprobante === 'aprobado' ? (
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  ) : (
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: expedienteCompletado ? '#0f172a' : '#64748b' }}>3. Comprobante de Pago</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Sube la fotografía o PDF del recibo de pago del banco.</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    {estadoComprobante === 'pendiente' && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pendiente de subir</span>}
                    {estadoComprobante === 'revision' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>En revisión por Colecturía</span>}
                    {estadoComprobante === 'aprobado' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pago Aprobado</span>}
                    {estadoComprobante === 'rechazado' && <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pago Rechazado</span>}
                  </div>
                  {estadoComprobante === 'rechazado' && admission?.paymentReceipt?.rejectionReason && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#b91c1c', background: '#fef2f2', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <strong>Motivo:</strong> {admission.paymentReceipt.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <input type="file" accept="image/*,.pdf" ref={fileInputRefPago} style={{ display: 'none' }} onChange={handleFileChangePago} />
                {(estadoComprobante === 'pendiente' || estadoComprobante === 'rechazado') && (
                  <button onClick={() => fileInputRefPago.current?.click()} disabled={!expedienteCompletado || isUploadingPago} style={{ padding: '0.8rem 1.5rem', background: expedienteCompletado ? '#008C5A' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: expedienteCompletado ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                    {isUploadingPago ? 'Subiendo...' : 'Subir Comprobante'}
                  </button>
                )}
              </div>
            </div>

            {/* PASO 4: CONTRATO */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoComprobante === 'aprobado' ? '5px solid #002a4a' : '5px solid #e2e8f0', opacity: estadoComprobante === 'aprobado' ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: estadoComprobante === 'aprobado' ? '#e0e7ff' : '#f1f5f9', padding: '1rem', borderRadius: '50%', color: estadoComprobante === 'aprobado' ? '#3730a3' : '#94a3b8' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: estadoComprobante === 'aprobado' ? '#0f172a' : '#64748b' }}>4. Generar Contrato</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {estadoComprobante === 'aprobado' ? 'Descarga e imprime tu contrato de servicios educativos para firmarlo físicamente.' : 'Este paso se habilitará automáticamente cuando tu comprobante sea revisado y aprobado.'}
                  </p>
                </div>
              </div>
              <button onClick={handleGenerarContrato} disabled={estadoComprobante !== 'aprobado'} style={{ padding: '0.8rem 1.5rem', background: estadoComprobante === 'aprobado' ? '#002a4a' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: estadoComprobante === 'aprobado' ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                Descargar Contrato
              </button>
            </div>

            {/* PASO 5: SUBIR CONTRATO FIRMADO */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoContrato === 'aprobado' ? '5px solid #22c55e' : (estadoComprobante === 'aprobado' ? '5px solid #FAB529' : '5px solid #e2e8f0'), opacity: estadoComprobante === 'aprobado' ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: estadoContrato === 'aprobado' ? '#dcfce7' : (estadoComprobante === 'aprobado' ? '#fef3c7' : '#f1f5f9'), padding: '1rem', borderRadius: '50%', color: estadoContrato === 'aprobado' ? '#16a34a' : (estadoComprobante === 'aprobado' ? '#d97706' : '#94a3b8') }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.4rem 0', color: estadoComprobante === 'aprobado' ? '#0f172a' : '#64748b' }}>5. Subir Contrato Firmado</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {estadoComprobante === 'aprobado' ? 'Escanea o toma una fotografía legible del contrato ya firmado y súbelo para auditoría.' : 'Se habilitará tras confirmar tu pago.'}
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    {estadoContrato === 'revision' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>En auditoría legal</span>}
                    {estadoContrato === 'rechazado' && <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Contrato Devuelto</span>}
                    {estadoContrato === 'aprobado' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>¡Matrícula Oficializada! 🎉</span>}
                  </div>
                  {estadoContrato === 'rechazado' && admission?.signedContract?.rejectionReason && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#b91c1c', background: '#fef2f2', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                      <strong>Motivo:</strong> {admission.signedContract.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <input type="file" accept="image/*,.pdf" ref={contratoInputRef} style={{ display: 'none' }} onChange={handleContratoChange} />
                {(estadoContrato === 'pendiente' || estadoContrato === 'rechazado') && estadoComprobante === 'aprobado' && (
                  <button onClick={() => contratoInputRef.current?.click()} disabled={isUploadingContrato} style={{ padding: '0.8rem 1.5rem', background: '#FAB529', color: '#030405', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: isUploadingContrato ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
                    {isUploadingContrato ? 'Subiendo...' : 'Subir Documento'}
                  </button>
                )}
              </div>
            </div>
          </div>

        ) : admission?.status === 'evaluations' ? (
          
          /* =========================================================
             VISTA: FASE DE EVALUACIONES (DINÁMICA)
             ========================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '8px', color: '#166534' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icons.Check /> ¡Documentos Aprobados!
              </h3>
              <p style={{ margin: 0, fontSize: '1rem' }}>Tu expediente está completo. A continuación verás el estado de tus evaluaciones programadas. Debes presentarte a la institución en las fechas indicadas.</p>
            </div>

            {/* TARJETA: EXAMEN ACADÉMICO */}
            <div className="portal-card" style={{ borderLeft: evalAcademica?.status === 'completed' ? '5px solid #22c55e' : '5px solid #0068B3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: evalAcademica?.status === 'completed' ? '#dcfce7' : '#e0f2fe', padding: '1rem', borderRadius: '50%', color: evalAcademica?.status === 'completed' ? '#16a34a' : '#0369a1' }}>
                    <Icons.AcademicCap />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', color: '#0f172a' }}>1. Examen Académico</h3>
                    {evalAcademica?.scheduledDate ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Icons.Calendar /> Cita: <strong>{formatearFecha(evalAcademica.scheduledDate)}</strong> a las <strong>{evalAcademica.scheduledTime || 'Hora por definir'}</strong>
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#f59e0b', fontSize: '0.9rem' }}>Esperando asignación de fecha por la institución...</p>
                    )}
                  </div>
                </div>

                {evalAcademica?.status === 'completed' ? (
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Check /> Examen Finalizado
                  </span>
                ) : evalAcademica?.manualAccessEnabled ? (
                  <button 
                    onClick={() => navigate(`/portal/examen/${evalAcademica.id}`)}
                    style={{ padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 104, 179, 0.2)' }}
                  >
                    Iniciar Examen en Línea
                  </button>
                ) : evalAcademica?.scheduledDate ? (
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                    Acceso bloqueado (Se habilita en la institución)
                  </span>
                ) : null}
              </div>
            </div>

            {/* TARJETA: PRUEBA PSICOLÓGICA */}
            <div className="portal-card" style={{ borderLeft: evalPsicologica?.status === 'completed' ? '5px solid #22c55e' : '5px solid #FAB529' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: evalPsicologica?.status === 'completed' ? '#dcfce7' : '#fef3c7', padding: '1rem', borderRadius: '50%', color: evalPsicologica?.status === 'completed' ? '#16a34a' : '#d97706' }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', color: '#0f172a' }}>2. Evaluación Psicológica</h3>
                    {evalPsicologica?.scheduledDate ? (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Icons.Calendar /> Cita: <strong>{formatearFecha(evalPsicologica.scheduledDate)}</strong> a las <strong>{evalPsicologica.scheduledTime || 'Hora por definir'}</strong>
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#f59e0b', fontSize: '0.9rem' }}>Esperando asignación de fecha por la institución...</p>
                    )}
                  </div>
                </div>

                {evalPsicologica?.status === 'completed' ? (
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icons.Check /> Evaluación Finalizada
                  </span>
                ) : evalPsicologica?.scheduledDate ? (
                  <span style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Presentarse en las instalaciones
                  </span>
                ) : null}
              </div>
            </div>
          </div>

        ) : admission?.status === 'interview' ? (
          
          /* =========================================================
             VISTA: FASE DE ENTREVISTA
             ========================================================= */
          <div className="portal-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ color: '#0068B3' }}><Icons.Clock /></div>
              <h2 style={{ color: '#002a4a', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Fase de Entrevista</h2>
            </div>
            <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '1.5rem', borderRadius: '8px', color: '#0369a1' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Has llegado a la fase final</h3>
              <p style={{ margin: 0, fontSize: '1rem' }}>
                Has completado satisfactoriamente tus evaluaciones.
                {evalEntrevista?.scheduledDate
                  ? ' Tu entrevista ya tiene cita asignada:'
                  : ' En los próximos días se te asignará una cita para realizar la entrevista con nuestras autoridades educativas.'}
              </p>
              {evalEntrevista?.scheduledDate && (
                <div style={{ marginTop: '1rem', background: 'white', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', color: '#0f172a' }}>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Icons.Calendar />
                    <strong>{formatearFecha(evalEntrevista.scheduledDate)}</strong>
                    a las <strong>{evalEntrevista.scheduledTime || 'hora por definir'}</strong>
                    · {evalEntrevista.location || 'Oficina de Psicología'}
                  </p>
                </div>
              )}
            </div>
          </div>

        ) : admission?.status === 'rejected' ? (

          /* =========================================================
             VISTA: RECHAZADO
             ========================================================= */
          <div className="portal-card" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '50%' }}><Icons.X /></div>
            </div>
            <h2 style={{ color: '#002a4a', fontSize: '1.5rem', fontWeight: 800 }}>Proceso Finalizado</h2>
            <p style={{ color: '#64748b' }}>Lamentamos informarte que tu solicitud no ha sido admitida para el ciclo escolar actual.</p>
          </div>

        ) : (
          
          /* =========================================================
             VISTA PREDETERMINADA: SUBIDA DE DOCUMENTOS (PENDING)
             ========================================================= */
          <>
            {admission?.status === 'pending' && !documentsStatus?.isComplete && (
              <div className="alert-box info">
                <div style={{ color: '#0284c7', marginTop: '0.2rem' }}><Icons.Document /></div>
                <div>
                  <h3 style={{ margin: 0, color: '#0369a1', fontWeight: 800 }}>Documentos Pendientes</h3>
                  <p style={{ margin: '0.3rem 0 0', color: '#0c4a6e', fontSize: '0.95rem' }}>Para continuar, debes subir los documentos solicitados. Tienes <strong>{documentsStatus?.approved || 0} de {documentsStatus?.totalRequired || requiredDocs.length}</strong> aprobados.</p>
                </div>
              </div>
            )}

            {/* NOTIFICACIÓN: documentos rechazados que necesitan corrección */}
            {(documentsStatus?.documents.filter(d => d.status === 'rejected').length ?? 0) > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1.2rem 1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#b91c1c', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.X /> Documentos que necesitan corrección
                </h3>
                <p style={{ margin: '0.4rem 0 0.7rem', color: '#7f1d1d', fontSize: '0.9rem' }}>
                  Un revisor marcó estos documentos. Por favor vuelve a subirlos con mejor calidad o legibilidad:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#7f1d1d', fontSize: '0.9rem' }}>
                  {documentsStatus!.documents.filter(d => d.status === 'rejected').map(d => (
                    <li key={d.id} style={{ marginBottom: '0.25rem' }}>
                      <strong>{admissionDocumentService.getDocumentTypeName(d.type)}:</strong>{' '}
                      {d.rejectionReason || 'Requiere una nueva versión.'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="portal-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ color: '#002a4a' }}><Icons.Document /></div>
                <h2 style={{ color: '#002a4a', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Documentos del Expediente</h2>
              </div>
              
              {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{error}</p>}

              {requiredDocs.map((docConfig) => {
                const uploadedDoc = documentsStatus?.documents.find(d => d.type === docConfig.type);
                
                const docIconMap: Record<string, JSX.Element> = {
                  'birth_certificate': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                  'previous_grades': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
                  'recent_photo': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                  'identification': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3" /></svg>,
                  'financial_solvency': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
                  'grade_certificate': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> 
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
                        
                        {uploadedDoc && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Paperclip /> {uploadedDoc.fileName}</span>
                            {uploadedDoc.status === 'pending' && <span style={{ background: '#fef9c3', color: '#b45309', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>En revisión</span>}
                            {uploadedDoc.status === 'resubmitted' && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Re-enviado</span>}
                            {uploadedDoc.status === 'approved' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Check /> Aprobado</span>}
                            {uploadedDoc.status === 'rejected' && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icons.X /> Rechazado</span>}
                          </div>
                        )}
                        
                        {uploadedDoc?.status === 'rejected' && uploadedDoc.rejectionReason && (
                          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#b91c1c', fontStyle: 'italic', backgroundColor: '#fca5a5', padding: '0.5rem', borderRadius: '6px' }}>
                            <strong>Motivo:</strong> {uploadedDoc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {(!uploadedDoc || uploadedDoc.status === 'rejected') && (
                      <div className="doc-actions">
                        <button 
                          className="btn-upload" 
                          onClick={() => handleFileSelect(docConfig.type)}
                          disabled={uploadingType === docConfig.type}
                          style={{ backgroundColor: uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3' }}
                        >
                          <Icons.Upload />
                          {uploadingType === docConfig.type ? 'Subiendo...' : uploadedDoc?.status === 'rejected' ? 'Re-subir' : 'Subir Archivo'}
                        </button>
                        <button 
                          className="btn-camera"
                          onClick={() => handleCameraSelect(docConfig.type)}
                          disabled={uploadingType === docConfig.type}
                          style={{ color: uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3', border: `1px solid ${uploadedDoc?.status === 'rejected' ? '#dc2626' : '#0068B3'}` }}
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

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            <input type="file" ref={cameraInputRef} style={{ display: 'none' }} accept="image/*" capture="environment" onChange={handleFileUpload} />
          </>
        )}

        {/* INFO DE CONTACTO */}
        <div className="alert-box success" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginTop: '2rem' }}>
          <div style={{ color: '#16a34a', marginTop: '0.2rem' }}><Icons.Phone /></div>
          <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem' }}>
            ¿Necesitas ayuda con el proceso? Llámanos al <strong>2486 0800</strong> o escríbenos a <strong>admisiones@salesianosanjose.edu.sv</strong>
          </p>
        </div>

      </main>

      {/* =======================================================
          MODAL DE EXPEDIENTE (COMPONENTE EXTERNO)
          ======================================================= */}
      {showExpedienteModal && (
        <ExpedienteModal
          isOpen={showExpedienteModal}
          onClose={() => setShowExpedienteModal(false)}
          onSave={handleGuardarExpediente}
          admission={admission}
        />
      )}

      <Footer />
    </div>
  );
}