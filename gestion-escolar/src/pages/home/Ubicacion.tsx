// src/pages/Ubicacion.tsx
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './Ubicacion.css';

export default function Ubicacion() {
  const [contacto, setContacto] = useState({
    telefono: 'Cargando información...',
    email: 'Cargando información...',
    direccion: 'Cargando información...'
  });

  useEffect(() => {
    const cargarDatosContacto = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'institucional', 'contactos'));
        if (docSnap.exists()) {
          setContacto({
            telefono: docSnap.data().telefono || 'No disponible',
            email: docSnap.data().email || 'No disponible',
            direccion: docSnap.data().direccion || 'No disponible'
          });
        }
      } catch (error) {
        console.error("Error cargando datos de contacto:", error);
      }
    };
    cargarDatosContacto();
    window.scrollTo(0, 0);
  }, []);

  // Función simulada para el formulario
  const handleEnviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    alert("¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.");
  };

  // URL exacta del Colegio Salesiano San José en Google Maps
const mapaIframe = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15502.836855110825!2d-89.56066265!3d13.9800587!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f62e620848db4cb%3A0x57f90b2d907fd094!2sColegio%20Salesiano%20San%20Jos%C3%A9!5e0!3m2!1ses!2ssv!4v1700000000000!5m2!1ses!2ssv";
  return (
    <div className="ubicacion-page">
      <Navbar />

      {/* Banner Verde Premium */}
      <section className="hero-ubicacion-premium">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Contáctanos
        </span>
        <h1 className="titulo-ubicacion" data-aos="fade-up" data-aos-delay="100">
          Estamos para <span style={{ color: '#FAB529' }}>Ayudarte</span>
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Visítanos en nuestro campus o envíanos un mensaje. Será un placer atender todas tus consultas.
        </p>
      </section>

      {/* Tarjeta Gigante Flotante */}
      <section className="seccion-superpuesta" data-aos="fade-up" data-aos-delay="300">
        <div className="tarjeta-contacto-maestra">
          
          {/* LADO IZQUIERDO: Información + Formulario */}
          <div className="columna-datos">
            
            {/* Bloque de Información desde Firebase */}
            <div className="bloque-info">
              <h3>Información de Contacto</h3>
              <div className="lista-info-premium">
                
                <div className="item-info verde">
                  <div className="icono-box">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </div>
                  <div className="texto-info">
                    <h4>Dirección del Campus</h4>
                    <p>{contacto.direccion}</p>
                  </div>
                </div>

                <div className="item-info">
                  <div className="icono-box">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.019a14.991 14.991 0 01-6.505-6.505l2.019-1.514c.362-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                  </div>
                  <div className="texto-info">
                    <h4>Teléfono de Atención</h4>
                    <p>{contacto.telefono}</p>
                  </div>
                </div>

                <div className="item-info dorado">
                  <div className="icono-box" style={{ color: '#FAB529' }}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  </div>
                  <div className="texto-info">
                    <h4>Correo Electrónico</h4>
                    <p>{contacto.email}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Separador sutil */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />

            {/* Bloque de Formulario */}
            <div className="bloque-formulario">
              <h3>Envíanos un mensaje</h3>
              <form className="formulario-contacto" onSubmit={handleEnviarMensaje}>
                <input type="text" className="input-premium" placeholder="Tu nombre completo" required />
                <input type="email" className="input-premium" placeholder="Tu correo electrónico" required />
                <textarea className="input-premium" rows={3} placeholder="¿En qué te podemos ayudar?" required></textarea>
                <button type="submit" className="btn-enviar-premium">Enviar Mensaje</button>
              </form>
            </div>

          </div>

          {/* LADO DERECHO: Mapa Borde a Borde */}
          <div className="columna-mapa">
            <iframe
              title="Mapa de Ubicación"
              src={mapaIframe}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}