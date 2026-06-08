// src/pages/About.tsx
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Img1 from '../../../public/img1.jpeg'; 


import { Navbar } from '../layout/Navbar';
import Footer from '../layout/Footer';
import '../../pages/About.css'; // Asegúrate de importar el CSS nuevo

export default function About() {
  const [info, setInfo] = useState({
    mision: 'Cargando misión...',
    vision: 'Cargando visión...'
  });

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'institucional', 'info_general'));
        if (docSnap.exists()) {
          setInfo({
            mision: docSnap.data().mision || '',
            vision: docSnap.data().vision || ''
          });
        }
      } catch (error) {
        console.error("Error obteniendo documento:", error);
      }
    };
    obtenerDatos();
  }, []);

  return (
    <div className="about-container">
      <Navbar />

      {/* =========================================
          BANNER HERO (ESTILO HOME: VERDE + PUNTOS)
          ========================================= */}
      <section className="hero-nosotros" data-aos="fade-in">
        <div className="hero-content">
          <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
            Institucional
          </span>
          <h1 className="titulo-hero" data-aos="fade-up" data-aos-delay="100">
            Acerca de <span style={{ color: '#FAB529' }}>Nosotros</span>
          </h1>
          <p className="desc-hero" data-aos="fade-up" data-aos-delay="200">
            Conoce nuestra historia, identidad y los valores que nos definen como la gran familia salesiana.
          </p>
        </div>
      </section>

      {/* =========================================
          SECCIÓN: QUIÉNES SOMOS
          ========================================= */}
      <section className="seccion-premium">
        <div className="col-texto" data-aos="fade-right">
          <span className="badge-premium">Nuestra Historia</span>
          <h2 className="titulo-premium" style={{ marginTop: '1rem' }}>
            Quiénes <span className="resalto-dorado">Somos</span>
          </h2>
          <p className="texto-base">
            El Colegio Salesiano San José forma profesionales íntegros, con consciente posesión de conocimientos y estatura moral. Acompañamos a nuestros estudiantes a través de una ruta de aprendizaje sólida, fomentando la convivencia armónica y cimentando una base académica robusta.
          </p>
        </div>
        <div className="col-imagen" data-aos="fade-left">
          <div className="imagen-decorada-dorada">
            <img src={Img1} alt="Estudiantes Salesianos" />
          </div>
        </div>
      </section>

      {/* =========================================
          SECCIÓN: IDENTIDAD (FIREBASE)
          ========================================= */}
      <section className="seccion-premium fondo-gris">
        <div style={{ textAlign: 'center' }} data-aos="fade-up">
          <span className="badge-premium">Identidad Institucional</span>
          <h2 className="titulo-premium" style={{ marginTop: '1rem' }}>
            Nuestro <span className="resalto-dorado">Propósito</span>
          </h2>
        </div>

        <div className="identidad-grid">
          
          {/* Tarjeta Misión */}
          <div className="tarjeta-identidad" data-aos="fade-up" data-aos-delay="100">
            <div className="icono-tarjeta">
              <svg width="32" height="32" fill="none" stroke="#008C5A" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
            </div>
            <h3 style={{ color: '#002a4a', fontSize: '1.5rem', marginBottom: '1rem' }}>Misión</h3>
            <p style={{ color: '#475569', lineHeight: '1.7' }}>{info.mision}</p>
          </div>

          {/* Tarjeta Visión */}
          <div className="tarjeta-identidad" data-aos="fade-up" data-aos-delay="250">
            <div className="icono-tarjeta">
              <svg width="32" height="32" fill="none" stroke="#0068B3" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 style={{ color: '#002a4a', fontSize: '1.5rem', marginBottom: '1rem' }}>Visión</h3>
            <p style={{ color: '#475569', lineHeight: '1.7' }}>{info.vision}</p>
          </div>

        </div>
      </section>

      {/* =========================================
          SECCIÓN: VALORES
          ========================================= */}
      <section className="seccion-premium">
        <div className="col-imagen" data-aos="fade-right">
          <div className="imagen-decorada-verde">
             <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80" alt="Valores" />
          </div>
        </div>
        <div className="col-texto" data-aos="fade-left">
          <span className="badge-premium">Nuestra Base</span>
          <h2 className="titulo-premium" style={{ marginTop: '1rem' }}>
            Principios y <span className="resalto-dorado">Valores</span>
          </h2>
          <p className="texto-base">
            Los principios que rigen al colegio son el pilar fundamental de nuestra comunidad educativa, guiando cada paso de nuestros estudiantes.
          </p>
          <div className="lista-valores-grid">
            <div className="valor-item">
              <strong>Fé</strong>
              <span>Actuar con equidad.</span>
            </div>
            <div className="valor-item">
              <strong>Alegría</strong>
              <span>Cumplir con el deber.</span>
            </div>
            <div className="valor-item">
              <strong>Honestidad</strong>
              <span>Apoyar al prójimo.</span>
            </div>
            <div className="valor-item">
              <strong>Solidaridad </strong>
              <span>Valorar a los demás.</span>
            </div>
            <div className="valor-item">
              <strong>Espíritu de familia</strong>
              <span>Valorar a los demás.</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}