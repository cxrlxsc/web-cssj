// src/pages/admin/AdminDashboard.tsx
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import { useUserRole } from '../../hooks/useUserRole';
import './adminStyles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { rol, cargando } = useUserRole();
  const esAdmin = rol === 'admin';

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard-layout">
      
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

      {/* CUERPO DEL PANEL PRINCIPAL */}
      <main className="dashboard-main">
        
        <header className="dashboard-welcome">
          <h2>Portal Administrativo Central</h2>
          <p>Seleccione el entorno operativo al cual desea ingresar para la gestión de datos.</p>
        </header>

        <div className="dashboard-grid">
          
          {/* ENTORNO 1: GESTIÓN PÚBLICA WEB */}
          <section className="dashboard-card card-web">
            
            <div className="card-header">
              <div className="icon-wrapper-web">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
              </div>
              <h3>Modificar Página Web</h3>
            </div>

            <div className="card-body">
              <p>
                Control de contenidos públicos del portal oficial. Modificación de secciones informativas como la agenda de eventos institucionales, historial de noticias, directorio administrativo y el cuadro de autoridades directivas.
              </p>
            </div>

            <div className="card-footer">
              <Link to="/admin/institucional" className="btn-action-web">
                <span>Gestionar Sitio Público</span>
                <svg className="arrow-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

          </section>

          {/* ENTORNO 2: RECURSOS INTERNOS ACADÉMICOS — solo para admin */}
          {!cargando && esAdmin && (
          <section className="dashboard-card card-recursos">
            
            <div className="card-header">
              <div className="icon-wrapper-recursos">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3>Recursos Internos Académicos</h3>
            </div>

            <div className="card-body">
              <p>
                Consola operativa escolar de acceso restringido. Destinado al control y validación de expedientes documentales de nuevo ingreso, monitoreo fiscal de colecturía para aranceles y emisión de códigos PIN académicos.
              </p>
            </div>

            <div className="card-footer">
              <Link to="/admin/recursos" className="btn-action-recursos">
                <span>Ingresar a Operaciones Internas</span>
                <svg className="arrow-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

          </section>
          )}

        </div>
      </main>
    </div>
  );
}