// src/pages/Noticias.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config'; // Asegúrate de que esta ruta sea correcta

import { Navbar } from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Noticias.css';

export default function Noticias() {
  const [noticias, setNoticias] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar Noticias desde Firebase
        const noticiasSnap = await getDocs(collection(db, 'noticias'));
        const listaNoticias = noticiasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNoticias(listaNoticias);

        // 2. Cargar Eventos desde Firebase
        const eventosSnap = await getDocs(collection(db, 'eventos'));
        const listaEventos = eventosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEventos(listaEventos);

      } catch (error) {
        console.error("Error al cargar los datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
    window.scrollTo(0, 0);
  }, []);

  // Función para asignar el color correcto a la etiqueta (badge)
  const obtenerClaseCategoria = (categoria: string) => {
    const cat = categoria?.toLowerCase() || '';
    if (cat.includes('académic') || cat.includes('academic')) return 'academico';
    if (cat.includes('deporte')) return 'deportes';
    if (cat.includes('institucional')) return 'institucional';
    if (cat.includes('importante')) return 'importante';
    return 'academico'; // Por defecto
  };

  return (
    <div className="noticias-page">
      <Navbar />

      <section className="hero-noticias" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Actualidad Institucional
        </span>
        <h1 className="titulo-noticias" data-aos="fade-up" data-aos-delay="100">
          Noticias y <span style={{ color: '#FAB529' }}>Eventos</span>
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Mantente informado sobre las últimas novedades, logros y la agenda de actividades de nuestra gran familia salesiana.
        </p>
      </section>

      <section className="layout-noticias">
        
        {/* COLUMNA IZQUIERDA: NOTICIAS DINÁMICAS */}
        <div className="grid-noticias">
          {cargando ? (
            <p style={{ color: '#64748b' }}>Cargando noticias...</p>
          ) : noticias.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay noticias publicadas por el momento.</p>
          ) : (
            noticias.map((noticia, index) => (
              <article key={noticia.id} className="noticia-card" data-aos="fade-up" data-aos-delay={index * 50}>
                <div className="noticia-img-wrapper">
                  <img src={noticia.imagen || "https://via.placeholder.com/800x400?text=Noticia"} alt={noticia.titulo} className="noticia-img" />
                </div>
                <div className="noticia-content">
                  <span className={`noticia-badge ${obtenerClaseCategoria(noticia.categoria)}`}>
                    {noticia.categoria || 'General'}
                  </span>
                  <h3 className="noticia-title">{noticia.titulo}</h3>
                  <p className="noticia-excerpt">{noticia.extracto || noticia.resumen}</p>
                  <div className="noticia-footer">
                    <span>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '5px', verticalAlign: 'middle' }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {noticia.fecha || 'Reciente'}
                    </span>
                    <a href="#" className="btn-leer-mas" onClick={(e) => e.preventDefault()}>
                      Leer más 
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </a>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* COLUMNA DERECHA: AGENDA PEGADA DINÁMICA */}
        <aside className="sidebar-agenda" data-aos="fade-left" data-aos-delay="300">
          <h3>
            <svg width="28" height="28" fill="none" stroke="#FAB529" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
            Agenda Escolar
          </h3>
          
          <div className="lista-eventos">
            {cargando ? (
              <p style={{ color: '#64748b' }}>Cargando agenda...</p>
            ) : eventos.length === 0 ? (
              <p style={{ color: '#64748b' }}>No hay eventos próximos programados.</p>
            ) : (
              eventos.map((evento) => (
                <div key={evento.id} className="evento-item">
                  <div className="evento-fecha">
                    <div className="evento-mes">{evento.mes || 'MES'}</div>
                    <div className="evento-dia">{evento.dia || '00'}</div>
                  </div>
                  <div className="evento-info">
                    <span className={`evento-categoria ${obtenerClaseCategoria(evento.categoria)}`}>
                      {evento.categoria || 'Institucional'}
                    </span>
                    <h4>{evento.titulo}</h4>
                    <p>{evento.descripcion}</p>
                  </div>
                </div>
              ))
            )}
          </div>

        </aside>

      </section>

      <Footer />
    </div>
  );
}