// src/components/home/CallToAction.tsx
import { Link } from 'react-router-dom';

export const CallToAction = () => {
  const imagenEjemplo = "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=800";

  return (
    <div className="seccion-inscripcion-premium">
      <div className="banner-premium">
        
        {/* COLUMNA IZQUIERDA: TEXTO */}
        <div className="inscripcion-info">
          <span className="eyebrow">Asegura tu futuro hoy</span>
          <h2 className="titulo-seccion">Inscripciones<br/>Abiertas 2026</h2>
          <p>
            Comienza tu solicitud en línea y únete a la Familia Salesiana del Colegio San José. ¡Cupos Limitados!
          </p>
          
          <ul className="guia-pasos-mini">
            <li><strong>1. Registro</strong> Crea tu cuenta</li>
            <li><strong>2. Solicitud</strong> Llena tus datos</li>
            <li><strong>3. Admisión</strong> Sé parte de nosotros</li>
          </ul>
          
          <div>
            <Link to="/solicitud-admision" className="btn-premium-aplicar">
              Aplicar Ahora
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* COLUMNA DERECHA: IMAGEN */}
        <div className="inscripcion-estudiantes">
          <img 
            src={imagenEjemplo} 
            alt="Estudiantes" 
            className="composicion-estudiantes"
          />
        </div>

      </div>
    </div>
  );
};