// src/pages/Historia.tsx
import { useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Historia.css';

export default function Historia() {
  
  // Datos históricos reales del Colegio Salesiano San José
  const hitosHistoricos = [
    {
      year: "1903",
      title: "Llegada y Fundación",
      description: "El 1 de marzo de 1903, el Colegio Salesiano San José abrió sus puertas en Santa Ana. Iniciando con educación primaria y el noviciado, los salesianos trajeron el sistema preventivo de Don Bosco a la región.",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop"
    },
    {
      year: "1905",
      title: "Los Primeros Talleres",
      description: "Siguiendo la visión integral de San Juan Bosco de preparar a los jóvenes para la vida y el trabajo, se instalaron los primeros talleres de carpintería y sastrería.",
      image: "https://images.pexels.com/photos/35548842/pexels-photo-35548842.jpeg "
    },
    {
      year: "2001",
      title: "El Nuevo Campus",
      description: "Ante el constante crecimiento del alumnado y las nuevas necesidades pedagógicas, el colegio migró a unas nuevas, amplias y modernas instalaciones en las afueras de la ciudad.",
      image: "https://images.pexels.com/photos/14382529/pexels-photo-14382529.jpeg"
    },
    {
      year: "2008",
      title: "Desarrollo Deportivo",
      description: "Bajo la dirección del P. Séptimo Rosoni y el P. Edgar Porta, se inauguró la piscina semiolímpica Don Bosco y el Centro Multideportivo, obras vanguardistas únicas en el occidente del país.",
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop"
    },
    {
      year: "2016",
      title: "Colegio Coeducativo",
      description: "Un hito trascendental en nuestra historia: el colegio abrió oficialmente sus puertas a las niñas, pasando a ser una institución mixta para ofrecer educación salesiana a toda la niñez santaneca.",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop"
    },
    {
      year: "2018",
      title: "Templo Sagrada Familia",
      description: "Se inauguró uno de los templos más grandes de la zona occidental, con capacidad para 1080 personas, convirtiéndose en el corazón de la formación espiritual de estudiantes y familias.",
      image: "https://images.pexels.com/photos/7396374/pexels-photo-7396374.jpeg"
    },
    {
      year: "Actualidad",
      title: "Innovación y Futuro",
      description: "Tras una intensa digitalización iniciada en 2019 y la apertura de nuevos proyectos de formación técnica (como la Bakery School en 2023), el San José sigue liderando la educación en El Salvador.",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop"
    }
  ];

  // Hacemos scroll al inicio cuando carga la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="historia-container">
      <Navbar />

      <section className="hero-historia" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Legado Institucional
        </span>
        <h1 data-aos="fade-up" data-aos-delay="100">
          Nuestra <span style={{ color: '#FAB529' }}>Historia</span>
        </h1>
        <p data-aos="fade-up" data-aos-delay="200">
          Un viaje a través del tiempo, recordando los hitos que forjaron más de un siglo de compromiso, fe y excelencia educativa salesiana.
        </p>
      </section>

      <section className="timeline-section">
        {hitosHistoricos.map((hito, index) => (
          <div key={index} className="timeline-item">
            
            {/* Contenido (Animación entra desde la izquierda o derecha según sea par o impar) */}
            <div className="timeline-content" data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}>
              <span className="timeline-year">{hito.year}</span>
              <h3>{hito.title}</h3>
              <p>{hito.description}</p>
            </div>

            {/* El circulito dorado decorativo */}
            <div className="timeline-dot" data-aos="zoom-in" data-aos-delay="200"></div>

            {/* Imagen (Animación contraria al texto) */}
            <div className="timeline-image" data-aos={index % 2 === 0 ? "fade-left" : "fade-right"}>
              <img src={hito.image} alt={hito.title} />
            </div>

          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}