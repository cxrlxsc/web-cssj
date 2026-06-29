// src/pages/CalendarioAcademico.tsx
import { useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './CalendarioAcademico.css';

export default function CalendarioAcademico() {
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="calendario-acad-page">
      <Navbar />

      {/* Banner Principal */}
      <section className="hero-calendario-acad" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Planificación Anual
        </span>
        <h1 className="titulo-calendario-acad" data-aos="fade-up" data-aos-delay="100">
          Calendario <span style={{ color: '#FAB529' }}>Académico 2026</span>
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Conoce las fechas clave, periodos de evaluación y actividades institucionales programadas para el ciclo escolar vigente.
        </p>
      </section>

      {/* Banner Flotante de Descarga */}
      <div className="banner-descarga-pdf" data-aos="fade-up" data-aos-delay="300">
        <div className="banner-descarga-info">
          <h3>Calendario Oficial en formato PDF</h3>
          <p>Descarga la versión imprimible con el cronograma detallado de todo el año escolar.</p>
        </div>
        <a href="#" className="btn-descargar-pdf" onClick={(e) => e.preventDefault()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Descargar PDF
        </a>
      </div>

      {/* Cuadrícula de Trimestres y Periodos */}
      <section className="layout-trimestres">
        
        {/* PRIMER TRIMESTRE */}
        <div className="trimestre-card t1" data-aos="fade-up">
          <div className="trimestre-header">
            <h3>Primer Trimestre</h3>
            <span className="trimestre-meses">Ene - Abr</span>
          </div>
          <div className="hito-lista">
            <div className="hito-item destacado">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">19</span>
                <span className="hito-mes">Ene</span>
              </div>
              <div className="hito-info">
                <h4>Inicio de Clases</h4>
                <p>Inauguración del Año Escolar 2026 para todos los niveles académicos.</p>
              </div>
            </div>
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">31</span>
                <span className="hito-mes">Ene</span>
              </div>
              <div className="hito-info">
                <h4>Fiesta de San Juan Bosco</h4>
                <p>Eucaristía solemne y actividades recreativas institucionales.</p>
              </div>
            </div>
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">23</span>
                <span className="hito-mes">Mar</span>
              </div>
              <div className="hito-info">
                <h4>Exámenes de Trimestre</h4>
                <p>Inicio del periodo de evaluaciones finales del primer trimestre.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEGUNDO TRIMESTRE */}
        <div className="trimestre-card t2" data-aos="fade-up" data-aos-delay="100">
          <div className="trimestre-header">
            <h3>Segundo Trimestre</h3>
            <span className="trimestre-meses">May - Ago</span>
          </div>
          <div className="hito-lista">
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">04</span>
                <span className="hito-mes">May</span>
              </div>
              <div className="hito-info">
                <h4>Inicio Segundo Trimestre</h4>
                <p>Retorno a clases y entrega de boletas de notas a padres de familia.</p>
              </div>
            </div>
            <div className="hito-item destacado">
              <div className="hito-fecha-circulo" style={{ background: '#008C5A', borderColor: '#008C5A' }}>
                <span className="hito-dia">24</span>
                <span className="hito-mes">May</span>
              </div>
              <div className="hito-info">
                <h4>Día de María Auxiliadora</h4>
                <p>Celebración magna institucional, procesión y consagración de estudiantes.</p>
              </div>
            </div>
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">20</span>
                <span className="hito-mes">Jul</span>
              </div>
              <div className="hito-info">
                <h4>Exámenes de Trimestre</h4>
                <p>Periodo de evaluaciones correspondientes al segundo trimestre.</p>
              </div>
            </div>
          </div>
        </div>

        {/* TERCER TRIMESTRE */}
        <div className="trimestre-card t3" data-aos="fade-up" data-aos-delay="200">
          <div className="trimestre-header">
            <h3>Tercer Trimestre</h3>
            <span className="trimestre-meses">Sep - Nov</span>
          </div>
          <div className="hito-lista">
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">15</span>
                <span className="hito-mes">Sep</span>
              </div>
              <div className="hito-info">
                <h4>Día de la Independencia</h4>
                <p>Acto Cívico Institucional y asueto nacional.</p>
              </div>
            </div>
            <div className="hito-item">
              <div className="hito-fecha-circulo">
                <span className="hito-dia">26</span>
                <span className="hito-mes">Oct</span>
              </div>
              <div className="hito-info">
                <h4>Exámenes Finales</h4>
                <p>Último bloque de evaluaciones generales del año escolar.</p>
              </div>
            </div>
            <div className="hito-item destacado">
              <div className="hito-fecha-circulo" style={{ background: '#FAB529', borderColor: '#FAB529' }}>
                <span className="hito-dia">12</span>
                <span className="hito-mes">Nov</span>
              </div>
              <div className="hito-info">
                <h4>Clausura Escolar</h4>
                <p>Misa de acción de gracias y acto de entrega de reconocimientos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* PERIODOS VACACIONALES */}
        <div className="trimestre-card vacaciones" data-aos="fade-up" data-aos-delay="300">
          <div className="trimestre-header">
            <h3>Periodos de Receso</h3>
            <span className="trimestre-meses" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>Asuetos</span>
          </div>
          <div className="hito-lista">
            <div className="hito-item">
              <div className="hito-fecha-circulo" style={{ color: '#ef4444' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              </div>
              <div className="hito-info">
                <h4>Semana Santa</h4>
                <p>Del 30 de marzo al 06 de abril. Retorno el martes 07 de abril.</p>
              </div>
            </div>
            <div className="hito-item">
              <div className="hito-fecha-circulo" style={{ color: '#ef4444' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>
              </div>
              <div className="hito-info">
                <h4>Fiestas Agostinas</h4>
                <p>Del 01 al 06 de agosto en honor al Divino Salvador del Mundo.</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}