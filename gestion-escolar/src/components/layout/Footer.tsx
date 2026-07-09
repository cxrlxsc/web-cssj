import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png'; // <-- Importamos el logo aquí también

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        
        {/* COLUMNA 1: Logo e Información de Contacto */}
        <div>
          <div className="footer-logo-container">
            <img src={logoImg} alt="Logo Colegio Salesiano San José" />
            <div className="footer-logo-text">
              <h2>COLEGIO SALESIANO</h2>
              <p>SAN JOSÉ</p>
            </div>
          </div>
          
          <div className="footer-info">
            <p>
              Final 17 Av. Sur, Calle Salesiano San José, Cantón Loma Alta, Santa Ana El Salvador.
            </p>
            <p>
              Email: admisiones@salesianosanjose.edu.sv
            </p>
            <p>
              Teléfono: (+503) 2486 0800
            </p>
          </div>
        </div>
        
        {/* COLUMNA 2: Enlaces de Interés */}
        <div>
          <h4 className="footer-titulo">Enlaces de Interés</h4>
          <ul className="footer-links">
            <li><a href="/proceso-inscripcion">Procesos Académicos</a></li>
            <li><a href="#registro">Registro Académico</a></li>
            <li><Link to="/solicitud-admision">Solicitud de Admisión</Link></li>
            <li><Link to="/login">Portal de Alumnos</Link></li>
            <li><Link to="#">Politicas de Privacidad</Link></li>
          </ul>
        </div>
        
        {/* COLUMNA 3: Redes Sociales */}
        <div>
          <h4 className="footer-titulo">Redes Sociales</h4>
          <p style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Conoce el acontecer educativo del Colegio Salesiano San José. 
            Síguenos en nuestras redes sociales institucionales.
          </p>
          
          <div className="social-icons">
            {/* Íconos temporales con texto, luego puedes usar FontAwesome o SVGs */}
            <a href="https://www.facebook.com/CSSJSA/" title="Facebook">F</a>
            <a href="https://www.instagram.com/cssj_sv/" title="Instagram">IG</a>
            <a href="#" title="WhatsApp">WA</a>
            <a href="#" title="TikTok">TK</a>
          </div>
        </div>
      </div>
      
      {/* Derechos de Autor */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Colegio Salesiano San José. Todos los derechos reservados.
          {' · '}
          <Link to="/politica-privacidad" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Política de Privacidad
          </Link>
        </p>
      </div>
    </footer>
  );
}