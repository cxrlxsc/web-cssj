// src/components/home/NewsPreview.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Asegúrate de que la ruta sea correcta

export const NewsPreview = () => {
  
  // 1. Estado para guardar las noticias reales de Firebase
  const [publicaciones, setPublicaciones] = useState<any[]>([]);

  // 2. Fetch para ir a buscar las noticias cuando carga la página
  useEffect(() => {
    const obtenerNoticias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "noticias"));
        const listaNoticias: any[] = [];
        querySnapshot.forEach((doc) => {
          listaNoticias.push({ id: doc.id, ...doc.data() });
        });
        
        // Guardamos las noticias en el estado
        setPublicaciones(listaNoticias);
      } catch (error) {
        console.error("Error al cargar las noticias:", error);
      }
    };

    obtenerNoticias();
  }, []);

  // Datos para la columna derecha (Agenda) - Los mantenemos estáticos por ahora
  const agenda = [
    { dia: "25", mes: "May", tag: "Académico", titulo: "Trámite de reingreso para Ciclo 02-2026. Excepto las especialidades a distancia." },
    { dia: "27", mes: "May", tag: "Evento", titulo: "Misa de graduandos de Bachillerato General y Técnico." },
    { dia: "27", mes: "May", tag: "Evento", titulo: "Tech Challenge (Todas las especialidades) para Instituciones de Educación." },
    { dia: "01", mes: "Jun", tag: "Evento", titulo: "Ceremonias de graduación promoción 2026." }
  ];

  return (
    <section id="noticias" className="seccion-portal-noticias">
      
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span 
          style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.5rem 1.5rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '1.2rem' }}
          data-aos="fade-down"
        >
          Actualidad Institucional
        </span>
        <h2 className="titulo-premium" data-aos="fade-up" data-aos-delay="100">
          Noticias y <span className="resalto-dorado">Eventos</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }} data-aos="fade-up" data-aos-delay="200">
          Descubre los logros, actividades destacadas y el calendario de nuestra comunidad educativa.
        </p>
      </div>

      <div className="portal-layout">
        
        {/* COLUMNA IZQUIERDA: PUBLICACIONES (AHORA DESDE FIREBASE) */}
        <div className="publicaciones-col">
          <div className="portal-header-group" data-aos="fade-right" data-aos-delay="250">
            <Link to="/noticias" className="portal-badge-title">Publicaciones</Link>
          </div>

          <div className="publicaciones-grid">
            {/* Si no hay noticias, mostramos un mensaje */}
            {publicaciones.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>Cargando publicaciones recientes...</p>
            ) : (
              // Si hay noticias, las mapeamos
              publicaciones.map((pub, index) => (
                <article 
                  key={pub.id} 
                  className="publicacion-item"
                  data-aos="fade-up" 
                  data-aos-delay={300 + (index * 150)}
                >
                  <div className="pub-img-container">
                    <span className="pub-tag">{pub.tag || 'Noticia'}</span>
                    <img src={pub.imagen} alt={pub.titulo} />
                  </div>
                  <h3 className="pub-titulo">{pub.titulo}</h3>
                  <span className="pub-fecha">{pub.fecha}</span>
                  <p className="pub-extracto">{pub.extracto}</p>
                  <span className="pub-visitas">{pub.visitas || '0 Visitas'}</span>
                </article>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: AGENDA (Estática por ahora) */}
        <div className="agenda-col">
          <div className="portal-header-group" data-aos="fade-left" data-aos-delay="250">
            <Link to="/agenda" className="portal-badge-title">Agenda</Link>
            <Link to="/directorio" className="portal-badge-title">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V18z"/>
              </svg>
              Directorio
            </Link>
          </div>

          <div className="agenda-list">
            {agenda.map((item, index) => (
              <div key={index} className="agenda-item" data-aos="fade-left" data-aos-delay={400 + (index * 100)}>
                <div className="agenda-fecha-box">
                  <span className="dia">{item.dia}</span>
                  <span className="mes">{item.mes}</span>
                </div>
                <div className="agenda-content">
                  <span className="agenda-tag">{item.tag}</span>
                  <p className="agenda-titulo">{item.titulo}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2.5rem' }} data-aos="zoom-in" data-aos-delay="800">
            <Link to="/graduados" className="portal-badge-title" style={{ width: '100%', justifyContent: 'center' }}>
              Graduados San José
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};