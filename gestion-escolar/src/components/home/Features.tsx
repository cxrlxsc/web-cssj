// src/components/home/Features.tsx
import { useRef, useEffect, useState } from 'react';

export const Features = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const features = [
    { 
      title: 'Educación Integral', 
      description: 'Formación académica de excelencia con sólidos valores salesianos.',
      hex: '#008C5A', 
      glow: 'rgba(0, 140, 90, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    { 
      title: 'Deportes', 
      description: 'Instalaciones deportivas de primer nivel y programas de desarrollo físico.',
      hex: '#0068B3', 
      glow: 'rgba(0, 104, 179, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-6.75c-.621 0-1.125.504-1.125 1.125v3.375m12-10.5h-2.251c.362 2.766-1.5 5.25-4.5 5.25H9c-3 0-4.862-2.484-4.5-5.25H2.25m17.25 0V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v2.25m17.25 0h-2.251m-15 0H2.25" /></svg>
    },
    { 
      title: 'Arte y Cultura', 
      description: 'Fomentamos la expresión artística, la música y las actividades culturales.',
      hex: '#008C5A', 
      glow: 'rgba(0, 140, 90, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.879-3.879a3 3 0 10-4.242-4.242l-3.879 3.879a15.995 15.995 0 00-4.648 4.764m3.42 3.42a6.823 6.823 0 01-3.42-3.42" /></svg>
    },
    { 
      title: 'Tecnología', 
      description: 'Laboratorios completamente equipados y educación digital de vanguardia.',
      hex: '#0068B3',
      glow: 'rgba(0, 104, 179, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
    },
    { 
      title: 'Pastoral', 
      description: 'Acompañamiento espiritual permanente guiados por el carisma de Don Bosco.',
      hex: '#008C5A',
      glow: 'rgba(0, 140, 90, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    },
    { 
      title: 'Comunidad', 
      description: 'Una gran familia salesiana comprometida integralmente con la educación.',
      hex: '#0068B3',
      glow: 'rgba(0, 104, 179, 0.2)',
      icon: <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
    }
  ];

  const itemsInfinitos = [...features, ...features, ...features];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (trackRef.current) {
        const track = trackRef.current;
        const itemWidth = 350; 

        if (track.scrollLeft >= (track.scrollWidth / 3) * 2) {
          track.scrollTo({ left: track.scrollWidth / 3, behavior: 'auto' });
        } else {
          track.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const moverManual = (dir: 'L' | 'R') => {
    if (trackRef.current) {
      const amount = dir === 'L' ? -350 : 350;
      trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="seccion-ruta-carrusel">
      
      {/* NUEVO ENCABEZADO PREMIUM CON ANIMACIONES AOS */}
      <div className="premium-header-wrapper">
        <span className="badge-premium" data-aos="fade-down">
          <svg width="16" height="16" fill="none" stroke="#FAB529" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          Nuestros Pilares
        </span>
        
        <h2 className="titulo-premium" data-aos="fade-up" data-aos-delay="100">
          Formación <span className="resalto-dorado">Integral</span>
        </h2>
        
        <p className="subtitulo-premium" data-aos="fade-up" data-aos-delay="200">
          Un recorrido diseñado estratégicamente para el desarrollo humano, profesional y espiritual de nuestros estudiantes en todas sus dimensiones.
        </p>
      </div>

      {/* CARRUSEL CON ANIMACIÓN DE ENTRADA SUAVE */}
      <div 
        className="ruta-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        data-aos="zoom-in-up" 
        data-aos-delay="350"
      >
        <button className="btn-ruta prev" onClick={() => moverManual('L')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>

        <div className="ruta-linea-fondo"></div>

        <div className="ruta-track" ref={trackRef}>
          {itemsInfinitos.map((f, i) => (
            <div 
              key={i} 
              className="ruta-estacion"
              style={{ '--accent-color': f.hex, '--glow-color': f.glow } as React.CSSProperties}
            >
              <div className="ruta-nodo">
                <div style={{ color: f.hex }}>{f.icon}</div>
              </div>
              <h3 className="ruta-titulo">{f.title}</h3>
              <p className="ruta-desc">{f.description}</p>
            </div>
          ))}
        </div>

        <button className="btn-ruta next" onClick={() => moverManual('R')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
      
    </section>
  );
};