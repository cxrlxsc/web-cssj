// src/components/home/EducationLevels.tsx

export const EducationLevels = () => {
  return (
    <section className="seccion-oferta">
      
      {/* Encabezado animado en cascada */}
      <div className="oferta-header">
        <span 
          className="etiqueta-formacion" 
          style={{ backgroundColor: '#fef3c7', color: '#d97706' }}
          data-aos="fade-down"
        >
          Oferta Educativa
        </span>
        
        <h2 
          className="titulo-premium" 
          style={{ fontSize: ' clamp(2.5rem, 4vw, 3.5rem)', marginBottom: '1rem' }}
          data-aos="fade-up" 
          data-aos-delay="100"
        >
          Niveles de <span className="resalto-dorado">Formación</span>
        </h2>
        
        <p 
          className="subtitulo-premium"
          data-aos="fade-up" 
          data-aos-delay="200"
        >
          Acompañamos a nuestros estudiantes a través de una ruta de aprendizaje sólida, desde su formación inicial hasta el bachillerato.
        </p>
      </div>

      {/* Grid de Tarjetas Blancas */}
      <div className="oferta-grid">
        
        {/* Tarjeta 1: Básica (Aparece primero) */}
        <div className="tarjeta-oferta basica" data-aos="fade-up" data-aos-delay="300">
          {/* Marca de agua (Libro SVG) */}
          <svg className="marca-agua-icono" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z"/></svg>
          
          <div className="oferta-icono-principal">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          
          <h3>Parvularia y Educación Básica</h3>
          <p>
            Desde Kinder 4 hasta 9° Grado. Brindamos un acompañamiento cercano, priorizando el desarrollo integral, la convivencia armónica y cimentando una base académica robusta en ciencias, lenguaje, matemáticas y valores espirituales.
          </p>
        </div>

        {/* Tarjeta 2: Bachillerato (Aparece una fracción de segundo después) */}
        <div className="tarjeta-oferta tecnico" data-aos="fade-up" data-aos-delay="450">
          {/* Marca de agua (Birrete SVG) */}
          <svg className="marca-agua-icono" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L1 9l11-6-11-6zm0 13l-7-3.82v5.06l7 3.82 7-3.82v-5.06L12 16z"/></svg>

          <div className="oferta-icono-principal">
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
          </div>

          <h3>Bachillerato General y Técnico</h3>
          <p>
            Preparación directa y especializada para afrontar con éxito el campo laboral y los estudios superiores universitarios. En el 3er año, nuestros alumnos dominan su área de especialización.
          </p>
          
          {/* Especialidades (Pills) */}
          <div className="especialidades-container">
            <span className="tag-especialidad">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
              Desarrollo de Software
            </span>
            <span className="tag-especialidad">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.879-3.879a3 3 0 10-4.242-4.242l-3.879 3.879a15.995 15.995 0 00-4.648 4.764m3.42 3.42a6.823 6.823 0 01-3.42-3.42" /></svg>
              Diseño Gráfico
            </span>
            <span className="tag-especialidad">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              Técnico Eléctrico
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};