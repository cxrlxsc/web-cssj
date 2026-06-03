// src/components/home/Hero.tsx
import { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.png'; 
import { CallToAction } from './CallToAction'; // Importamos tu componente

export default function Hero() {
  // Estado para controlar qué diapositiva se está viendo
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2; // Pantalla 1: Texto Original | Pantalla 2: Inscripciones

  // Efecto para que el carrusel se mueva solo cada 6 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
    }, 6000); 
    return () => clearInterval(interval);
  }, []);

  // Funciones para las flechas manuales
  const nextSlide = () => setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));

  return (
    <section id="inicio" className="hero-udb-style" style={{ padding: 0 }}>
      
      {/* Flecha Izquierda */}
      <button className="hero-arrow left" onClick={prevSlide}>
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>

      {/* CONTENEDOR DESLIZABLE */}
      <div 
        className="hero-slider-wrapper"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        
        {/* === DIAPOSITIVA 1: TEXTO ORIGINAL === */}
        <div className="hero-slide">
          <div className="hero-udb-content">
            <span className="comilla-apertura">"</span>
            <h1>
              Educación integral para <br/>
              continuar <span>formando generaciones</span>
            </h1>
            <span className="comilla-cierre">"</span>

            <div className="hero-logo-bottom">
              <img src={logoImg} alt="Logo" style={{ width: '50px' }} />
              <h2>COLEGIO SALESIANO<br/>SAN JOSÉ</h2>
            </div>
          </div>
        </div>

        {/* === DIAPOSITIVA 2: TU COMPONENTE DE INSCRIPCIONES === */}
        <div className="hero-slide">
          {/* El componente renderiza el diseño de CallToAction con el CSS que preparamos */}
          <CallToAction />
        </div>

      </div>

      {/* Flecha Derecha */}
      <button className="hero-arrow right" onClick={nextSlide}>
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </button>

      {/* INDICADORES (Puntos de navegación inferiores) */}
      <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '0.8rem', zIndex: 20 }}>
        {[0, 1].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            style={{
              width: currentSlide === index ? '35px' : '12px',
              height: '12px',
              borderRadius: '12px',
              backgroundColor: currentSlide === index ? '#FAB529' : 'rgba(255,255,255,0.3)',
              border: 'none',
              transition: 'all 0.4s ease',
              cursor: 'pointer',
              boxShadow: currentSlide === index ? '0 2px 5px rgba(0,0,0,0.3)' : 'none'
            }}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          />
        ))}
      </div>

    </section>
  );
}