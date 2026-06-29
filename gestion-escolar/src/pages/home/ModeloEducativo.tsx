// src/pages/ModeloEducativo.tsx
import { useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './ModeloEducativo.css';

export default function ModeloEducativo() {
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="modelo-page">
      <Navbar />

      {/* Banner Superior */}
      <section className="hero-modelo" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Excelencia Salesiana
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100" style={{ color: 'white', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900 }}>
          Nuestro <span style={{ color: '#FAB529' }}>Modelo Educativo</span>
        </h1>
        <p style={{ maxWidth: '700px', margin: '1rem auto', color: '#e2e8f0', fontSize: '1.2rem' }} data-aos="fade-up" data-aos-delay="200">
          Formamos "Buenos Cristianos y Honrados Ciudadanos" a través de una pedagogía de la alegría, la razón y el amor.
        </p>
      </section>

      {/* Contenido de Pilares */}
      <section className="seccion-modelo-content">
        
        {/* Pilar 1: Académico */}
        <div className="pilar-card" data-aos="fade-up">
          <div className="pilar-info">
            <span style={{ color: '#008C5A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>Dimensión Intelectual</span>
            <h3>Excelencia Académica</h3>
            <p>Nuestro currículo está diseñado para desarrollar competencias críticas y analíticas. Implementamos metodologías activas donde el estudiante es el protagonista de su aprendizaje, preparándolo para los desafíos de la educación superior global.</p>
            <ul style={{ listStyle: 'none', padding: 0, color: '#475569' }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Inglés intensivo</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Certificaciones tecnológicas</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Laboratorios de vanguardia</li>
            </ul>
          </div>
          <div className="pilar-imagen">
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800" alt="Académico" />
          </div>
        </div>

        {/* Pilar 2: Técnico */}
        <div className="pilar-card" data-aos="fade-up">
          <div className="pilar-info">
            <span style={{ color: '#FAB529', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>Dimensión Profesional</span>
            <h3>Bachillerato Técnico</h3>
            <p>Somos referentes en la formación técnica del país. Nuestros estudiantes egresan con habilidades prácticas inmediatas para el mundo laboral, respaldadas por convenios con industrias líderes.</p>
            
            <div className="grid-especialidades">
              
              {/* Especialidad 1 */}
              <div className="especialidad-item">
                <span className="especialidad-icon" style={{ display: 'flex', justifyContent: 'center', color: '#FAB529' }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <h4>Electromecánica</h4>
              </div>

              {/* Especialidad 2 */}
              <div className="especialidad-item">
                <span className="especialidad-icon" style={{ display: 'flex', justifyContent: 'center', color: '#FAB529' }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </span>
                <h4>Desarrollo de Software</h4>
              </div>

              {/* Especialidad 3 */}
              <div className="especialidad-item">
                <span className="especialidad-icon" style={{ display: 'flex', justifyContent: 'center', color: '#FAB529' }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.999 2.999 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.999 2.999 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                </span>
                <h4>Pastelería y Panadería</h4>
              </div>

            </div>
          </div>
          <div className="pilar-imagen">
            <img src="https://images.unsplash.com/photo-1581092921461-7d65505b19d0?auto=format&fit=crop&w=800" alt="Técnico" />
          </div>
        </div>

        {/* Pilar 3: Humano/Pastoral */}
        <div className="pilar-card" data-aos="fade-up">
          <div className="pilar-info">
            <span style={{ color: '#0068B3', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>Dimensión Espiritual</span>
            <h3>Formación del Corazón</h3>
            <p>Inspirados en el Sistema Preventivo de Don Bosco, buscamos que el joven se sienta amado. La formación en valores, el acompañamiento espiritual y el compromiso social son el eje que da sentido a toda nuestra labor.</p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: '12px', borderLeft: '5px solid #0068B3' }}>
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '1rem' }}>"La educación es cosa del corazón, y solo Dios tiene las llaves de él." - San Juan Bosco</p>
            </div>
          </div>
          <div className="pilar-imagen">
            <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800" alt="Pastoral" />
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}