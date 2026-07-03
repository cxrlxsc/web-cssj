// src/pages/admin/AdminRecursosInternos.tsx
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './adminStyles/AdminRecursosInternos.css';

export default function AdminRecursosInternos() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  return (
    <div className="admin-recursos-layout">
      
      {/* BARRA DE NAVEGACIÓN INSTITUCIONAL */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="recursos-main">
        
        {/* HEADER MODERNO CON BOTÓN DE RETROCESO INTEGRADO */}
        <header className="recursos-header">
          <div className="header-titles">
            <h1>Recursos y Operaciones Internas</h1>
            <p>Seleccione el módulo administrativo al que desea acceder.</p>
          </div>
          <Link to="/admin/dashboard" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver al Panel Central
          </Link>
        </header>

        {/* CUADRÍCULA DE MÓDULOS (CARDS) */}
        <div className="recursos-grid">
          
          {/* MÓDULO 1: ADMISIONES (AZUL) */}
          <section className="recurso-card card-admisiones">
            <div className="card-top">
              <div className="recurso-icon icon-blue">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Aprobación de Expedientes</h3>
                <p>Revisión de partidas de nacimiento, fotos, notas de años anteriores y DUIs de aspirantes de nuevo ingreso.</p>
              </div>
            </div>
            <Link to="/admin/solicitudes" className="btn-recurso btn-blue">
              <span>Revisar Archivos</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* MÓDULO 2: COLECTURÍA (VERDE) */}
          <section className="recurso-card card-colecturia">
            <div className="card-top">
              <div className="recurso-icon icon-green">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Colecturía y Aranceles</h3>
                <p>Comprobación bancaria de recibos de matrícula cargados por alumnos de Reingreso y Nuevo Ingreso.</p>
              </div>
            </div>
            <Link to="/admin/colecturia" className="btn-recurso btn-green">
              <span>Verificar Pagos</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* MÓDULO 3: CÓDIGOS (DORADO) */}
          <section className="recurso-card card-codigos">
            <div className="card-top">
              <div className="recurso-icon icon-gold">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Generador de Códigos</h3>
                <p>Creación de credenciales, emisión de pines de acceso seguro para admisiones y contraseñas.</p>
              </div>
            </div>
            <Link to="/admin/codigos" className="btn-recurso btn-gold">
              <span>Gestionar Códigos</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* MÓDULO 4: CONTRATOS FIRMADOS (AZUL PROFUNDO) */}
          <section className="recurso-card card-contratos">
            <div className="card-top">
              <div className="recurso-icon icon-navy">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Revisión de Contratos</h3>
                <p>Auditoría legal de contratos firmados. Aprobación final para concretar la matrícula oficial de los estudiantes.</p>
              </div>
            </div>
            <Link to="/admin/contratos-firmados" className="btn-recurso btn-navy">
              <span>Auditar Documentos</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </Link>
          </section>

          {/* MÓDULO 5: EVALUACIONES (VIOLETA) */}
          <section className="recurso-card card-evaluaciones">
            <div className="card-top">
              <div className="recurso-icon icon-purple">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Gestión de Evaluaciones</h3>
                <p>Agenda citas presenciales para aspirantes y construye los exámenes académicos que se realizarán en línea.</p>
              </div>
            </div>

            {/* Botones de acción divididos */}
            <div className="btn-group">
              <Link to="/admin/evaluaciones" className="btn-recurso btn-purple" style={{ flex: 1 }}>
                <span>Ver Aspirantes</span>
              </Link>
              <Link to="/admin/evaluaciones/constructor" className="btn-recurso btn-purple" style={{ flex: 1 }}>
                <span>Crear Examen</span>
              </Link>
            </div>
          </section>

          {/* MÓDULO 6: APROBACIÓN Y MATRÍCULA (VERDE ESMERALDA) */}
          <section className="recurso-card card-aprobacion">
            <div className="card-top">
              <div className="recurso-icon icon-emerald">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Aprobación y Matrícula</h3>
                <p>Decisión final de admisión: aprueba al aspirante y genera su carnet, correo institucional y contraseña.</p>
              </div>
            </div>
            <Link to="/admin/aprobacion" className="btn-recurso btn-emerald">
              <span>Aprobar Estudiantes</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* MÓDULO 7: EDITOR DE PLANTILLA DE CONTRATO (ÍNDIGO) */}
          <section className="recurso-card card-contrato-editor">
            <div className="card-top">
              <div className="recurso-icon icon-indigo">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div className="recurso-text">
                <h3>Editor de Contrato</h3>
                <p>Modifica las cláusulas y textos fijos del contrato de servicios educativos. Los datos del alumno se toman del expediente automáticamente.</p>
              </div>
            </div>
            <Link to="/admin/contratos" className="btn-recurso btn-indigo">
              <span>Editar Plantilla</span>
              <svg className="arrow-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}