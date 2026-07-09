// src/components/home/CallToAction.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Img2 from '../../../public/inscripcion.jpeg';
import { useAnioMatricula } from '../../hooks/useAnioMatricula';
import { obtenerPortadas } from '../../hooks/usePortada';


export const CallToAction = () => {
  const anioMatricula = useAnioMatricula();

  // Imagen configurable desde el Gestor de Página Web; si no hay nada
  // configurado se usa la foto local por defecto.
  const [imagenCta, setImagenCta] = useState<string>(Img2);
  useEffect(() => {
    let activo = true;
    obtenerPortadas().then((portadas) => {
      const url = portadas['cta-inscripcion']?.imagen;
      if (activo && url) setImagenCta(url);
    });
    return () => { activo = false; };
  }, []);

  return (
    <div className="seccion-inscripcion-premium">
      <div className="banner-premium">

        {/* COLUMNA IZQUIERDA: TEXTO */}
        <div className="inscripcion-info">
          <span className="eyebrow">Asegura tu futuro hoy</span>
          <h2 className="titulo-seccion">Inscripciones<br/>Abiertas {anioMatricula}</h2>
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

        {/* COLUMNA DERECHA: IMAGEN CON MARCO DECORADO */}
        <div className="inscripcion-estudiantes">
          <div className="marco-estudiantes">
            <img
              src={imagenCta}
              alt="Estudiantes"
              className="composicion-estudiantes"
            />
            <div className="chip-flotante-cta">
              <svg width="18" height="18" fill="none" stroke="#008C5A" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Admisión 100% en línea
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
