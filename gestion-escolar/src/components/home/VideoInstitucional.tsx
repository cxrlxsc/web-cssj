// src/components/home/VideoInstitucional.tsx
// Video institucional embebido desde YouTube (no se sube al proyecto).
// Usa una "portada" con botón de play: el iframe de YouTube solo se carga
// cuando el usuario da clic, así la página inicial no pesa de más.
import { useState } from 'react';
import './VideoInstitucional.css';

const VIDEO_ID = 'cJtbjtekmBY';

export const VideoInstitucional = () => {
  const [activo, setActivo] = useState(false);

  return (
    <section className="video-seccion">
      <div className="video-header" data-aos="fade-up">
        <span className="badge-premium">
          <svg width="16" height="16" fill="none" stroke="#FAB529" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          Conócenos
        </span>
        <h2 className="titulo-premium" data-aos="fade-up" data-aos-delay="100">
          Vive la <span className="resalto-dorado">Experiencia Salesiana</span>
        </h2>
        <p className="subtitulo-premium" data-aos="fade-up" data-aos-delay="200">
          Un vistazo a la vida, los valores y el día a día de nuestra gran familia salesiana.
        </p>
      </div>

      <div className="video-marco" data-aos="zoom-in-up" data-aos-delay="300">
        {activo ? (
          <iframe
            className="video-media"
            src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
            title="Video institucional Colegio Salesiano San José"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button className="video-portada" onClick={() => setActivo(true)} aria-label="Reproducir video institucional">
            <img
              className="video-media"
              src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
              alt="Video institucional del Colegio Salesiano San José"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${VIDEO_ID}/hqdefault.jpg`; }}
            />
            <span className="video-velo" />
            <span className="video-play">
              <svg width="34" height="34" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </section>
  );
};
