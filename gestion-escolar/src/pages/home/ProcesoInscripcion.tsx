// src/pages/ProcesoInscripcion.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom'; // <-- IMPORTANTE: Agregamos Link para la navegación interna
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAnioMatricula } from '../../hooks/useAnioMatricula';
import './ProcesoInscripcion.css';

export default function ProcesoInscripcion() {
  const anioMatricula = useAnioMatricula();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="inscripcion-page">
      <Navbar />

      <section className="hero-inscripcion" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Admisiones {anioMatricula}
        </span>
        <h1 className="titulo-inscripcion" data-aos="fade-up" data-aos-delay="100">
          Proceso de <span style={{ color: '#FAB529' }}>Inscripción</span>
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Únete a la familia del Colegio Salesiano San José. Te guiamos paso a paso para formar parte de nuestra comunidad educativa.
        </p>
      </section>

      <section className="bento-container" data-aos="fade-up" data-aos-delay="300">
        <div className="bento-grid">

          {/* Caja 1: Banner de Imagen */}
          <div className="bento-box span-2 bg-imagen-destacada">
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#FAB529' }}>Inscripción abierta</h2>
            <h3 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '1.5rem' }}>Ciclo Escolar {anioMatricula}</h3>
            <p style={{ maxWidth: '400px', color: '#e2e8f0', marginBottom: '1rem' }}>
              Campus principal Santa Ana. Cupos disponibles desde Parvularia hasta Bachillerato.
            </p>
            <a href="https://wa.me/50324400000" target="_blank" rel="noreferrer" className="whatsapp-badge" style={{ textDecoration: 'none' }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.393.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-5.824 4.74-10.563 10.564-10.563 5.826 0 10.564 4.738 10.564 10.563 0 5.826-4.74 10.563-10.564 10.563z"/></svg>
              2440-0000
            </a>
          </div>

          {/* Caja 2: Dorado (Info General) */}
          <div className="bento-box bg-dorado">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
            <h3>Solicita más información</h3>
            <p>¿Tienes dudas sobre nuestras especialidades técnicas o el modelo educativo? Estamos para orientarte.</p>
            {/* Convertido a Link */}
            <Link to="/ubicacion" className="btn-bento">Quiero conocer más</Link>
          </div>

          {/* Caja 3: Azul Oscuro (Nuevo Ingreso) */}
          <div className="bento-box bg-azul-oscuro">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
            <h3>Nuevo Ingreso</h3>
            <p>Inicia tu proceso de admisión para estudiantes de primer ingreso. Evaluaciones diagnósticas y entrevistas.</p>
            {/* CONECTADO AL PORTAL DE NUEVO INGRESO */}
            <Link to="/solicitud-admision" className="btn-bento">Inicia tu proceso aquí</Link>
          </div>

          {/* Caja 4: Verde (Antiguo Ingreso) */}
          <div className="bento-box bg-verde">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            <h3>Antiguo Ingreso</h3>
            <p>Proceso de ratificación de matrícula para estudiantes activos. Actualización de datos y reserva de cupo.</p>
            {/* CONECTADO AL NUEVO LOGIN DE REINGRESO */}
            <Link to="/reingreso/login" className="btn-bento">Renovar matrícula</Link>
          </div>

          {/* Caja 5: Celeste (Aranceles) */}
          <div className="bento-box bg-celeste">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
            <h3>Aranceles</h3>
            <p>Conoce los importes a cancelar durante el proceso de inscripción y colegiaturas mensuales por nivel.</p>
            <a href="#" className="btn-bento">Ver cuotas {anioMatricula}</a>
          </div>

          {/* Caja 6: Gris (Documentación) */}
          <div className="bento-box span-2 bg-gris">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="#002a4a" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            <h3>Proceso y Documentación</h3>
            <p>
              Detalle de los pasos a seguir y documentos requeridos (Partida de nacimiento, constancia de conducta, 
              boleta de notas anterior) que debes entregar en nuestras oficinas de Registro Académico.
            </p>
            <a href="#" className="btn-bento">Descargar guía PDF</a>
          </div>

          {/* Caja 7: Dorado (Campus) */}
          <div className="bento-box bg-dorado">
            <svg className="bento-icon" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            <h3>Visita nuestro Campus</h3>
            <p>Conoce nuestras instalaciones deportivas, laboratorios técnicos y aulas multimedia.</p>
            {/* Convertido a Link */}
            <Link to="/ubicacion" className="btn-bento">Ver mapa</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}