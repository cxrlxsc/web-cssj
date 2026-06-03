// src/pages/admisiones/ProcesoAdmision.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Admisiones.css';

// Tipos para simular el estado de los documentos
type DocEstado = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';

interface Documento {
  id: number;
  nombre: string;
  descripcion: string;
  requerido: boolean;
  estado: DocEstado;
  iconoClave: string; // Cambiamos el emoji por una clave de icono
  motivoRechazo?: string;
}

export default function ProcesoAdmision() {
  const alumnoInfo = {
    nombre: "Carlos Castaneda",
    grado: "Kinder 5",
    fecha: "20/5/2026",
    codigo: "CSSJ27-EGCCPP"
  };

  const [documentos, setDocumentos] = useState<Documento[]>([
    { id: 1, nombre: "Partida de Nacimiento", descripcion: "Partida de nacimiento original o certificada del estudiante", requerido: true, estado: "pendiente", iconoClave: "certificado" },
    { id: 2, nombre: "Notas del Año Anterior", descripcion: "Certificado de notas del último año cursado", requerido: false, estado: "rechazado", iconoClave: "notas", motivoRechazo: "El documento subido está borroso. Por favor, escanee el documento original con mejor iluminación." },
    { id: 3, nombre: "Foto Reciente", descripcion: "Fotografía reciente tamaño carné del estudiante", requerido: true, estado: "aprobado", iconoClave: "foto" },
    { id: 4, nombre: "DUI del Responsable", descripcion: "Copia del DUI del padre, madre o tutor legal", requerido: true, estado: "revision", iconoClave: "id" }
  ]);

  const handleSubirDocumento = (id: number) => {
    setDocumentos(docs => docs.map(doc => 
      doc.id === id ? { ...doc, estado: 'revision', motivoRechazo: undefined } : doc
    ));
  };

  const aprobados = documentos.filter(d => d.estado === 'aprobado').length;
  const totalRequeridos = documentos.filter(d => d.requerido).length;

  // Función auxiliar para renderizar los SVGs de los documentos
  const renderIconoDocumento = (clave: string) => {
    switch(clave) {
      case 'certificado':
        return <svg width="28" height="28" fill="none" stroke="#0068B3" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
      case 'notas':
        return <svg width="28" height="28" fill="none" stroke="#0068B3" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
      case 'foto':
        return <svg width="28" height="28" fill="none" stroke="#0068B3" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;
      case 'id':
        return <svg width="28" height="28" fill="none" stroke="#0068B3" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>;
      default:
        return <svg width="28" height="28" fill="none" stroke="#0068B3" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    }
  };

  return (
    <div className="dashboard-layout">
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-title">
          <h1>Proceso de Admisión</h1>
          <p>{alumnoInfo.nombre}</p>
        </div>
        <div className="header-actions">
          <Link to="/" className="btn-outline">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver
          </Link>
          <button className="btn-outline">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            Actualizar
          </button>
          <Link to="/solicitud-admision" className="btn-solid-blue">Salir</Link>
        </div>
      </header>

      <main className="dashboard-container">
        
        {/* Tarjeta 1: Estado y Timeline */}
        <div className="dashboard-card">
          <div className="estado-header">
            <h2>Estado de Solicitud</h2>
            <span className="badge-estado">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              En Revisión
            </span>
          </div>

          <div className="info-grid">
            <p><strong>Grado solicitado:</strong> {alumnoInfo.grado}</p>
            <p><strong>Fecha de aplicación:</strong> {alumnoInfo.fecha}</p>
            <p><strong>Código:</strong> {alumnoInfo.codigo}</p>
          </div>

          <p style={{fontSize: '0.9rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem'}}>Progreso del Proceso</p>
          
          <div className="timeline-container">
            {/* 1. Formulario (Completado) */}
            <div className="timeline-step completado">
              <div className="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <span className="step-text">Formulario</span>
            </div>
            <div className="timeline-line activa"></div>

            {/* 2. Documentos (Actual) */}
            <div className="timeline-step actual">
              <div className="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
              </div>
              <span className="step-text">Documentos</span>
            </div>
            <div className="timeline-line"></div>

            {/* 3. Pruebas (Pendiente) */}
            <div className="timeline-step">
              <div className="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
              </div>
              <span className="step-text">Pruebas</span>
            </div>
            <div className="timeline-line"></div>

            {/* 4. Entrevista (Pendiente) */}
            <div className="timeline-step">
              <div className="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.84 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
              </div>
              <span className="step-text">Entrevista</span>
            </div>
            <div className="timeline-line"></div>

            {/* 5. Decisión (Pendiente) */}
            <div className="timeline-step">
              <div className="step-icon">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>
              </div>
              <span className="step-text">Decisión</span>
            </div>
          </div>
        </div>

        {/* Tarjeta 2: Lista de Documentos */}
        <div className="dashboard-card">
          <div className="docs-header">
            <h3>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
              Documentos Requeridos
            </h3>
            <span className="badge-estado" style={{background: '#fef08a'}}>{aprobados}/{totalRequeridos} aprobados</span>
          </div>

          <div className="docs-list">
            {documentos.map((doc) => (
              <div key={doc.id} className="doc-item" style={{ borderColor: doc.estado === 'rechazado' ? '#fca5a5' : '#e5e7eb' }}>
                <div className="doc-info">
                  <div className="doc-icon">
                    {renderIconoDocumento(doc.iconoClave)}
                  </div>
                  <div className="doc-details">
                    <h4>{doc.nombre} {doc.requerido && <span className="req">*</span>}</h4>
                    <p>{doc.descripcion}</p>
                    
                    {doc.estado === 'rechazado' && (
                      <div className="rechazo-motivo">
                        <strong>Motivo de rechazo:</strong> {doc.motivoRechazo}
                      </div>
                    )}
                  </div>
                </div>

                <div className="doc-actions">
                  {(doc.estado === 'pendiente' || doc.estado === 'rechazado') && (
                    <button className="btn-subir" onClick={() => handleSubirDocumento(doc.id)}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                      Subir {doc.estado === 'rechazado' ? 'de nuevo' : ''}
                    </button>
                  )}
                  {doc.estado === 'revision' && (
                    <span className="estado-texto revision">En revisión</span>
                  )}
                  {doc.estado === 'aprobado' && (
                    <span className="estado-texto aprobado">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      Aprobado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '1rem'}}>* Los documentos marcados son obligatorios. Formatos aceptados: PDF, JPG, PNG.</p>
        </div>

        {/* Alertas Inferiores */}
        <div className="alerta-info">
          <div style={{color: '#ca8a04'}}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
          </div>
          <div>
            <h4>Documentos en Revisión</h4>
            <p>Tus documentos están siendo revisados por nuestro equipo de admisiones. Te notificaremos cuando sean aprobados para continuar con el proceso de pruebas.</p>
          </div>
        </div>

        <div className="alerta-contacto">
          <h4>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            ¿Tienes dudas?
          </h4>
          <p style={{color: '#3b82f6', fontSize: '0.9rem', marginBottom: '0.5rem'}}>Si tienes alguna pregunta sobre tu proceso de admisión, puedes contactarnos:</p>
          <ul>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Email: admisiones@salesianosanjose.edu.sv
            </li>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 1.892a15.84 15.84 0 01-6.502-6.502l1.892-1.514c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              Teléfono: 2486 0801
            </li>
            <li>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Horario: Lunes a Viernes, 7:00 AM - 4:00 PM
            </li>
          </ul>
        </div>

      </main>
    </div>
  );
}