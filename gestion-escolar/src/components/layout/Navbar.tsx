// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png'; 
import './NavbarCSSJ.css'; // <-- Importamos el nuevo CSS

export const Navbar = () => {
  // Lógica para añadir una sombra al header pegajoso solo al hacer scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`udb-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="udb-nav-container">
        
        {/* Logo */}
        <Link to="/" className="udb-logo-wrapper">
          <img src={logoImg} alt="Logo Salesiano" style={{ width: '50px' }} />
          <div className="udb-logo-text">
            <h1>COLEGIO</h1>
            <p>SALESIANO SAN JOSÉ</p> {/* Ajusta el texto según prefieras */}
          </div>
        </Link>
        
        {/* Enlaces y Mega Menus */}
        <ul className="udb-nav-links">
          
          <li className="udb-nav-item">
            <Link to="/" className="udb-nav-link">Inicio</Link>
          </li>

          {/* Item con Mega Menu (Nosotros) */}
          <li className="udb-nav-item">
            <div className="udb-nav-link">
              Institucional 
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
            
            {/* El cuadro blanco que baja */}
            <div className="udb-mega-menu">
              <div className="mega-menu-column">
                <Link to="/nosotros" className="mega-menu-link">Quiénes Somos</Link>
                <Link to="/historia" className="mega-menu-link">Nuestra Historia</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/autoridades" className="mega-menu-link">Autoridades</Link>
                <Link to="/ubicacion" className="mega-menu-link">Ubicación</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/mundo-salesiano" className="mega-menu-link">Mundo Salesiano</Link>
                <Link to="/modelo-educativo" className="mega-menu-link">Modelo Educativo</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/directorio-institucional" className="mega-menu-link">Directorio Institucional</Link>
                <Link to="/noticias" className="mega-menu-link">Noticias y Eventos</Link>
              </div>
            </div>
          </li>

          {/* Item con Mega Menu (Registro Académico) */}
          <li className="udb-nav-item">
            <div className="udb-nav-link">
              Registro Académico
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
            <div className="udb-mega-menu">
              <div className="mega-menu-column">
                <a href="proceso-inscripcion" className="mega-menu-link">Procesos de Inscripción</a>
                <a href="#notas" className="mega-menu-link">Consulta de Notas</a>
              </div>
              <div className="mega-menu-column">
                <a href="/calendario-academico" className="mega-menu-link">Calendario Académico</a>
              </div>
            </div>
          </li>

          <li className="udb-nav-item">
            <Link to="/noticias" className="udb-nav-link">Noticias</Link>
          </li>
          
          <li className="udb-nav-item">
            <a href="#contacto" className="udb-nav-link">Contáctanos</a>
          </li>

        </ul>

        {/* Botón Aplicar Ahora (Estilo "Nuevo Ingreso") */}
        <div>
          <Link to="/solicitud-admision" className="udb-btn-amarillo">
             <span>Aplicar Ahora</span>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </div>
    </header>
  );
};
