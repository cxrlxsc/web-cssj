// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png'; 
import './NavbarCSSJ.css';

export const Navbar = () => {
  // Lógica de Scroll
  const [scrolled, setScrolled] = useState(false);
  
  // NUEVO: Estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para alternar menú
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  // Función para cerrar el menú al hacer clic en un enlace (muy importante en celulares)
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`udb-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="udb-nav-container">
        
        {/* Logo */}
        <Link to="/" className="udb-logo-wrapper" onClick={closeMenu}>
          <img src={logoImg} alt="Logo Salesiano" style={{ width: '50px' }} />
          <div className="udb-logo-text">
            <h1>COLEGIO</h1>
            <p>SALESIANO SAN JOSÉ</p>
          </div>
        </Link>
        
        {/* Enlaces y Mega Menus (Le agregamos la clase dinámica mobile-open) */}
        <ul className={`udb-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          
          <li className="udb-nav-item">
            <Link to="/" className="udb-nav-link" onClick={closeMenu}>Inicio</Link>
          </li>

          {/* Item con Mega Menu (Nosotros) */}
          <li className="udb-nav-item">
            <div className="udb-nav-link">
              Institucional 
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
            
            <div className="udb-mega-menu">
              <div className="mega-menu-column">
                <Link to="/nosotros" className="mega-menu-link" onClick={closeMenu}>Quiénes Somos</Link>
                <Link to="/historia" className="mega-menu-link" onClick={closeMenu}>Nuestra Historia</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/autoridades" className="mega-menu-link" onClick={closeMenu}>Autoridades</Link>
                <Link to="/ubicacion" className="mega-menu-link" onClick={closeMenu}>Ubicación</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/mundo-salesiano" className="mega-menu-link" onClick={closeMenu}>Mundo Salesiano</Link>
                <Link to="/modelo-educativo" className="mega-menu-link" onClick={closeMenu}>Modelo Educativo</Link>
              </div>
              <div className="mega-menu-column">
                <Link to="/directorio-institucional" className="mega-menu-link" onClick={closeMenu}>Directorio Institucional</Link>
                <Link to="/noticias" className="mega-menu-link" onClick={closeMenu}>Noticias y Eventos</Link>
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
                <Link to="/proceso-inscripcion" className="mega-menu-link" onClick={closeMenu}>Procesos de Inscripción</Link>
                <a href="#notas" className="mega-menu-link" onClick={closeMenu}>Consulta de Notas</a>
              </div>
              <div className="mega-menu-column">
                <Link to="/calendario-academico" className="mega-menu-link" onClick={closeMenu}>Calendario Académico</Link>
              </div>
            </div>
          </li>

          <li className="udb-nav-item">
            <Link to="/noticias" className="udb-nav-link" onClick={closeMenu}>Noticias</Link>
          </li>
          
          <li className="udb-nav-item">

            <a href="/directorio-institucional" className="udb-nav-link">Contáctanos</a>

          </li>

        </ul>

        {/* CONTENEDOR DERECHO: Botón Aplicar y Hamburguesa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/solicitud-admision" className="udb-btn-amarillo">
             <span>Aplicar Ahora</span>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>

          {/* NUEVO: Botón Hamburguesa (Solo visible en móvil mediante CSS) */}
          <button className="udb-hamburger" onClick={toggleMenu} aria-label="Abrir menú">
            {isMobileMenuOpen ? (
              <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};