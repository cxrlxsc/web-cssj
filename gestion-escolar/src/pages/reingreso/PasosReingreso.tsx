// src/pages/reingreso/PasosReingreso.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockStudentDB } from '../../data/mockStudent';

type ComprobanteEstado = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';
type ContratoEstado = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';

export const PasosReingreso = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contratoInputRef = useRef<HTMLInputElement>(null); // Referencia para subir el contrato
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [talonarioGenerado, setTalonarioGenerado] = useState(false);
  
  const [estadoComprobante, setEstadoComprobante] = useState<ComprobanteEstado>('pendiente');
  const [isUploading, setIsUploading] = useState(false);

  // Estados para el nuevo Paso 4 (Contrato Firmado)
  const [estadoContrato, setEstadoContrato] = useState<ContratoEstado>('pendiente');
  const [isUploadingContrato, setIsUploadingContrato] = useState(false);

  useEffect(() => {
    const sessionCarnet = localStorage.getItem('studentSession');
    if (!sessionCarnet || !mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]) {
      navigate('/reingreso/login'); 
    } else {
      const studentData = mockStudentDB[sessionCarnet as keyof typeof mockStudentDB];
      setStudent(studentData);
      
      // Leer estados desde la memoria (Simulando Firebase)
      const pagoGuardado = localStorage.getItem(`pago_${studentData.carnet}`);
      if (pagoGuardado) setEstadoComprobante(pagoGuardado as ComprobanteEstado);

      const contratoGuardado = localStorage.getItem(`contrato_${studentData.carnet}`);
      if (contratoGuardado) setEstadoContrato(contratoGuardado as ContratoEstado);
    }
  }, [navigate]);

  if (!student) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando panel...</div>;

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/reingreso/login');
  };

  const handleGenerarTalonario = () => {
    setTalonarioGenerado(true);
    window.open('/reingreso/talonario', '_blank');
  };

  // Subida del recibo de pago
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setEstadoComprobante('revision');
        localStorage.setItem(`pago_${student.carnet}`, 'revision');
      }, 2000);
    }
  };

  const handleGenerarContrato = () => {
    navigate('/imprimir-contrato');
  };

  // Subida del contrato físico firmado (Paso 4)
  const handleContratoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingContrato(true);
      setTimeout(() => {
        setIsUploadingContrato(false);
        setEstadoContrato('revision');
        // Al guardar en revisión, aparecerá en el panel "AdminContratosFirmados"
        localStorage.setItem(`contrato_${student.carnet}`, 'revision');
      }, 2500);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER DEL ALUMNO */}
      <div style={{ background: '#008C5A', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Panel de Matrícula 2026</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>{student.nombres} {student.apellidos} • {student.gradoMatricular}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* PASO 1: TALONARIO */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #FAB529' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '50%', color: '#d97706' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#0f172a' }}>1. Generar Talonario</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Descarga tu talonario para realizar el pago de matrícula y colegiatura.</p>
            </div>
          </div>
          <button onClick={handleGenerarTalonario} style={{ padding: '0.8rem 1.5rem', background: talonarioGenerado ? '#f1f5f9' : '#0068B3', color: talonarioGenerado ? '#475569' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {talonarioGenerado ? 'Descargar de nuevo' : 'Descargar PDF'}
          </button>
        </div>

        {/* PASO 2: SUBIR COMPROBANTE */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoComprobante === 'aprobado' ? '5px solid #22c55e' : '5px solid #0068B3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: estadoComprobante === 'aprobado' ? '#dcfce7' : '#e0f2fe', padding: '1rem', borderRadius: '50%', color: estadoComprobante === 'aprobado' ? '#16a34a' : '#0284c7' }}>
              {estadoComprobante === 'aprobado' ? (
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              )}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: '#0f172a' }}>2. Comprobante de Pago</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Sube la fotografía o PDF del recibo de pago del banco.</p>
              
              <div style={{ marginTop: '0.5rem' }}>
                {estadoComprobante === 'pendiente' && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pendiente de subir</span>}
                {estadoComprobante === 'revision' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>En revisión por Colecturía</span>}
                {estadoComprobante === 'aprobado' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pago Aprobado</span>}
                {estadoComprobante === 'rechazado' && <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Pago Rechazado</span>}
              </div>
            </div>
          </div>
          
          <div>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            {(estadoComprobante === 'pendiente' || estadoComprobante === 'rechazado') && (
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isUploading}
                style={{ padding: '0.8rem 1.5rem', background: '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isUploading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {isUploading ? 'Subiendo...' : 'Subir Comprobante'}
              </button>
            )}
          </div>
        </div>

        {/* PASO 3: CONTRATO (Solo visualización) */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoComprobante === 'aprobado' ? '5px solid #002a4a' : '5px solid #e2e8f0', opacity: estadoComprobante === 'aprobado' ? 1 : 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: estadoComprobante === 'aprobado' ? '#e0e7ff' : '#f1f5f9', padding: '1rem', borderRadius: '50%', color: estadoComprobante === 'aprobado' ? '#3730a3' : '#94a3b8' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: estadoComprobante === 'aprobado' ? '#0f172a' : '#64748b' }}>3. Generar Contrato</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {estadoComprobante === 'aprobado' 
                  ? 'Descarga e imprime tu contrato de servicios educativos para firmarlo físicamente.' 
                  : 'Este paso se habilitará automáticamente cuando tu comprobante sea revisado y aprobado.'}
              </p>
            </div>
          </div>
          <button onClick={handleGenerarContrato} disabled={estadoComprobante !== 'aprobado'} style={{ padding: '0.8rem 1.5rem', background: estadoComprobante === 'aprobado' ? '#002a4a' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: estadoComprobante === 'aprobado' ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
            Descargar Contrato
          </button>
        </div>

        {/* PASO 4: SUBIR CONTRATO FIRMADO (NUEVO) */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: estadoContrato === 'aprobado' ? '5px solid #22c55e' : (estadoComprobante === 'aprobado' ? '5px solid #FAB529' : '5px solid #e2e8f0'), opacity: estadoComprobante === 'aprobado' ? 1 : 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: estadoContrato === 'aprobado' ? '#dcfce7' : (estadoComprobante === 'aprobado' ? '#fef3c7' : '#f1f5f9'), padding: '1rem', borderRadius: '50%', color: estadoContrato === 'aprobado' ? '#16a34a' : (estadoComprobante === 'aprobado' ? '#d97706' : '#94a3b8') }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.4rem 0', color: estadoComprobante === 'aprobado' ? '#0f172a' : '#64748b' }}>4. Subir Contrato Firmado</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {estadoComprobante === 'aprobado' 
                  ? 'Escanea o toma una fotografía legible del contrato ya firmado y súbelo para auditoría.' 
                  : 'Se habilitará tras confirmar tu pago.'}
              </p>
              
              <div style={{ marginTop: '0.5rem' }}>
                {estadoComprobante === 'aprobado' && estadoContrato === 'pendiente' && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Esperando documento</span>}
                {estadoContrato === 'revision' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>En Auditoría Legal</span>}
                {estadoContrato === 'rechazado' && <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>Documento Devuelto (Verificar)</span>}
                {estadoContrato === 'aprobado' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>¡Matrícula Oficializada! 🎉</span>}
              </div>
            </div>
          </div>
          
          <div>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              ref={contratoInputRef} 
              style={{ display: 'none' }} 
              onChange={handleContratoChange}
            />

            {(estadoContrato === 'pendiente' || estadoContrato === 'rechazado') && estadoComprobante === 'aprobado' && (
              <button 
                onClick={() => contratoInputRef.current?.click()} 
                disabled={isUploadingContrato}
                style={{ padding: '0.8rem 1.5rem', background: '#FAB529', color: '#030405', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: isUploadingContrato ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {isUploadingContrato ? 'Subiendo...' : 'Subir Documento'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};