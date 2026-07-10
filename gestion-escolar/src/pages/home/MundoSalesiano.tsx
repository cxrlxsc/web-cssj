// src/pages/MundoSalesiano.tsx
import { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { usePortada } from '../../hooks/usePortada';
import './MundoSalesiano.css';
import img1 from '../../../public/DB2031.jpeg'

export default function MundoSalesiano() {
  const portada = usePortada('mundo-salesiano');
  // Estado que controla qué pestaña estamos viendo
  const [seccionActiva, setSeccionActiva] = useState('don_bosco');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Función para renderizar el contenido según la sección activa
  const renderizarContenido = () => {
    switch (seccionActiva) {
      case 'don_bosco':
        return (
          <div className="animacion-fade-in">
            <h2>Don Bosco: Padre y Maestro</h2>
            <img 
              src={img1}
              style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '16px', marginBottom: '2rem' }}
            />
            <p>Nacido en Castelnuovo (Italia) en 1815, Juan Bosco dedicó su vida entera a la educación y salvación de los jóvenes más necesitados de la Revolución Industrial.</p>
            <p>Desde su famoso "sueño de los 9 años", comprendió que su misión sería transformar corazones no con golpes, sino con amor, paciencia y mansedumbre. Fundó la Congregación Salesiana en 1859, dejando un legado que hoy abarca los 5 continentes.</p>
            <blockquote style={{ borderLeft: '5px solid #FAB529', paddingLeft: '1.5rem', margin: '2rem 0', fontStyle: 'italic', color: '#008C5A', fontSize: '1.3rem', fontWeight: 'bold' }}>
              "Me basta que seáis jóvenes para que os ame."
            </blockquote>
          </div>
        );

      case 'sistema_preventivo':
        return (
          <div className="animacion-fade-in">
            <h2>El Sistema Preventivo</h2>
            <p>El método pedagógico de Don Bosco se basa en prevenir las faltas a través de una presencia constante y amorosa del educador, evitando los castigos represivos.</p>
            
            <div className="grid-tres-columnas">
              <div className="tarjeta-interior">
                <div className="icono-interior">
                  <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.829 1.508-2.336 1.145-.683 1.942-1.927 1.942-3.372a4.5 4.5 0 00-9 0c0 1.445.797 2.689 1.942 3.372.85.507 1.508 1.353 1.508 2.336v.192m-7.136-1.5c.2-.057.404-.112.612-.163M21.136 16.5c-.2-.057-.404-.112-.612-.163" /></svg>
                </div>
                <h3>Razón</h3>
                <p>Educar desde el sentido común, el diálogo y la persuasión lógica.</p>
              </div>
              
              <div className="tarjeta-interior" style={{ borderTopColor: '#0068B3' }}>
                <div className="icono-interior" style={{ color: '#0068B3' }}>
                  <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>
                </div>
                <h3>Religión</h3>
                <p>Cimentar la vida en la fe y la presencia de Dios en lo cotidiano.</p>
              </div>

              <div className="tarjeta-interior" style={{ borderTopColor: '#FAB529' }}>
                <div className="icono-interior" style={{ color: '#FAB529' }}>
                  <svg width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                </div>
                <h3>Amor</h3>
                <p>Que el joven no solo sea amado, sino que se sienta amado verdaderamente.</p>
              </div>
            </div>
          </div>
        );

      case 'familia_salesiana':
        return (
          <div className="animacion-fade-in">
            <h2>La Familia Salesiana</h2>
            <p>Don Bosco no fundó solo una congregación, sino un vasto movimiento de personas dedicadas a la salvación de la juventud. Hoy somos un gran árbol con más de 30 ramas unidas por un mismo carisma.</p>
            
            <div className="grid-tres-columnas" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="tarjeta-interior">
                <h3 style={{ color: '#008C5A' }}>Hijas de María Auxiliadora</h3>
                <p>Congregación religiosa femenina cofundada con Santa María Mazzarello.</p>
              </div>
              <div className="tarjeta-interior">
                <h3 style={{ color: '#0068B3' }}>Salesianos Cooperadores</h3>
                <p>Laicos comprometidos que viven el espíritu de Don Bosco en el mundo secular.</p>
              </div>
              <div className="tarjeta-interior" style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ color: '#FAB529' }}>Exalumnos de Don Bosco</h3>
                <p>Asociación mundial de hombres y mujeres formados en nuestras casas, siendo "buenos cristianos y honrados ciudadanos".</p>
              </div>
            </div>
          </div>
        );

      case 'red_ius':
        return (
          <div className="animacion-fade-in">
            <h2>Red IUS Global</h2>
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80" 
              alt="Estudiantes Universitarios" 
              style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '2rem' }}
            />
            <p>Las Instituciones Salesianas de Educación Superior (IUS) son una red mundial de más de 95 universidades en los 5 continentes.</p>
            <p>Estamos comprometidos con la excelencia académica, la investigación profesional y la inspiración cristiana, formando líderes que transformen la sociedad y defiendan la dignidad humana.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mundo-page">
      <Navbar />

      <section className="hero-mundo" style={portada} data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Nuestra Identidad
        </span>
        <h1 className="titulo-mundo" data-aos="fade-up" data-aos-delay="100">
          Mundo <span style={{ color: '#FAB529' }}>Salesiano</span>
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Descubre el legado global, la misión y la pedagogía que nos inspira desde hace más de un siglo.
        </p>
      </section>

      <section className="seccion-mundo-layout" data-aos="fade-up" data-aos-delay="300">
        <div className="tarjeta-mundo-maestra">
          
          {/* LADO IZQUIERDO: Contenido Dinámico */}
          <div className="contenido-dinamico">
            {renderizarContenido()}
          </div>

          {/* LADO DERECHO: Menú Lateral */}
          <div className="sidebar-menu">
            <div className="sidebar-menu-sticky">
              <h3>Índice Salesiano</h3>
              <div className="opciones-lista">
                
                <button 
                  className={`opcion-btn ${seccionActiva === 'don_bosco' ? 'activa' : ''}`}
                  onClick={() => setSeccionActiva('don_bosco')}
                >
                  <span className="opcion-icono">◆</span> Don Bosco
                </button>
                
                <button 
                  className={`opcion-btn ${seccionActiva === 'sistema_preventivo' ? 'activa' : ''}`}
                  onClick={() => setSeccionActiva('sistema_preventivo')}
                >
                  <span className="opcion-icono">◆</span> Sistema Preventivo
                </button>
                
                <button 
                  className={`opcion-btn ${seccionActiva === 'familia_salesiana' ? 'activa' : ''}`}
                  onClick={() => setSeccionActiva('familia_salesiana')}
                >
                  <span className="opcion-icono">◆</span> Familia Salesiana
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
