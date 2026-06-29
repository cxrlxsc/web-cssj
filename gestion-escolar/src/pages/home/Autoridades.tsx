// src/pages/Autoridades.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './Autoridades.css';

export default function Autoridades() {
  const [autoridades, setAutoridades] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAutoridades = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "autoridades"));
        const lista: any[] = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() });
        });
        setAutoridades(lista);
      } catch (error) {
        console.error("Error al cargar autoridades:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarAutoridades();
    window.scrollTo(0, 0); // Que inicie en la parte superior al cambiar de página
  }, []);

  return (
    <div className="autoridades-page">
      <Navbar />

      {/* Banner Verde */}
      <section className="hero-autoridades" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Directorio Institucional
        </span>
        <h1 className="titulo-autoridades" data-aos="fade-up" data-aos-delay="100">
          Nuestras <span style={{ color: '#FAB529' }}>Autoridades</span>
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Conoce al equipo directivo que guía y acompaña a nuestra comunidad educativa bajo el carisma de Don Bosco.
        </p>
      </section>

      {/* Grid de Tarjetas desde Firebase */}
      <section className="autoridades-grid">
        
        {cargando ? (
          <div className="mensaje-vacio">Cargando directorio...</div>
        ) : autoridades.length === 0 ? (
          <div className="mensaje-vacio">
            <h3 style={{ color: '#002a4a', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Directorio en actualización</h3>
            <p>Aún no se han registrado autoridades en el sistema.</p>
          </div>
        ) : (
          autoridades.map((persona, index) => (
            <div 
              key={persona.id} 
              className="autoridad-card" 
              data-aos="fade-up" 
              data-aos-delay={index * 100} // Animación en cascada
            >
              <div className="card-header-accent"></div>
              {/* Imagen de la autoridad */}
              <img 
                src={persona.imagen || 'https://via.placeholder.com/150'} 
                alt={persona.nombre} 
                className="autoridad-avatar" 
              />
              <h3 className="autoridad-nombre">{persona.nombre}</h3>
              <span className="autoridad-cargo">{persona.cargo}</span>
            </div>
          ))
        )}

      </section>

      {/* El Footer se empuja hacia abajo si hay pocas tarjetas gracias al flex-col del contenedor */}
      <div style={{ flex: 1 }}></div>
      <Footer />
    </div>
  );
}