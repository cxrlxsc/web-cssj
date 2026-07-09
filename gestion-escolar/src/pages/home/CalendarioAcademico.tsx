// src/pages/CalendarioAcademico.tsx
// Calendario académico PÚBLICO. Los hitos se administran desde el Gestor de
// Página Web (/admin/institucional → Agenda de Eventos) y se agrupan aquí
// automáticamente por trimestre según su fecha. La categoría "Asueto" se
// muestra en la tarjeta de Periodos de Receso.
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAnioMatricula } from '../../hooks/useAnioMatricula';
import { usePortada } from '../../hooks/usePortada';
import './CalendarioAcademico.css';

interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha: string;      // 'YYYY-MM-DD'
  categoria?: string;
  dia: string;
  mes: string;
}

export default function CalendarioAcademico() {
  const anioMatricula = useAnioMatricula();
  const portada = usePortada('calendario-academico');
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    (async () => {
      try {
        const snap = await getDocs(collection(db, 'eventos'));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() } as EventoCalendario));
        lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        setEventos(lista);
      } catch (error) {
        console.error('Error al cargar el calendario:', error);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Agrupación por trimestre según el mes de la fecha (los asuetos van aparte)
  const mesDe = (e: EventoCalendario) => new Date(`${e.fecha}T12:00:00`).getMonth();
  const esAsueto = (e: EventoCalendario) => (e.categoria || '').toLowerCase().includes('asueto') || (e.categoria || '').toLowerCase().includes('receso');
  const lectivos = eventos.filter(e => !esAsueto(e));
  const trimestres = [
    { clase: 't1', nombre: 'Primer Trimestre', meses: 'Ene - Abr', items: lectivos.filter(e => mesDe(e) <= 3), delay: 0 },
    { clase: 't2', nombre: 'Segundo Trimestre', meses: 'May - Ago', items: lectivos.filter(e => mesDe(e) >= 4 && e && mesDe(e) <= 7), delay: 100 },
    { clase: 't3', nombre: 'Tercer Trimestre', meses: 'Sep - Dic', items: lectivos.filter(e => mesDe(e) >= 8), delay: 200 },
  ];
  const asuetos = eventos.filter(esAsueto);

  return (
    <div className="calendario-acad-page">
      <Navbar />

      {/* Banner Principal */}
      <section className="hero-calendario-acad" style={portada} data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Planificación Anual
        </span>
        <h1 className="titulo-calendario-acad" data-aos="fade-up" data-aos-delay="100">
          Calendario <span style={{ color: '#FAB529' }}>Académico {anioMatricula}</span>
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

        {trimestres.map(trimestre => (
          <div key={trimestre.clase} className={`trimestre-card ${trimestre.clase}`} data-aos="fade-up" data-aos-delay={trimestre.delay}>
            <div className="trimestre-header">
              <h3>{trimestre.nombre}</h3>
              <span className="trimestre-meses">{trimestre.meses}</span>
            </div>
            <div className="hito-lista">
              {trimestre.items.length === 0 ? (
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  {cargando ? 'Cargando actividades…' : 'Sin actividades publicadas para este trimestre.'}
                </p>
              ) : (
                trimestre.items.map((evento, i) => (
                  <div key={evento.id} className={`hito-item ${i === 0 ? 'destacado' : ''}`}>
                    <div className="hito-fecha-circulo">
                      <span className="hito-dia">{evento.dia}</span>
                      <span className="hito-mes">{evento.mes}</span>
                    </div>
                    <div className="hito-info">
                      <h4>{evento.titulo}</h4>
                      <p>{evento.descripcion || evento.categoria || 'Actividad institucional.'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {/* PERIODOS VACACIONALES (eventos con categoría "Asueto / Receso") */}
        <div className="trimestre-card vacaciones" data-aos="fade-up" data-aos-delay="300">
          <div className="trimestre-header">
            <h3>Periodos de Receso</h3>
            <span className="trimestre-meses" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>Asuetos</span>
          </div>
          <div className="hito-lista">
            {asuetos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                {cargando ? 'Cargando…' : 'Los periodos de receso se anunciarán próximamente.'}
              </p>
            ) : (
              asuetos.map(evento => (
                <div key={evento.id} className="hito-item">
                  <div className="hito-fecha-circulo" style={{ color: '#ef4444' }}>
                    <span className="hito-dia">{evento.dia}</span>
                    <span className="hito-mes">{evento.mes}</span>
                  </div>
                  <div className="hito-info">
                    <h4>{evento.titulo}</h4>
                    <p>{evento.descripcion || 'Receso institucional.'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}
