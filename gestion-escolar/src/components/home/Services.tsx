// src/components/home/Services.tsx
import { Link } from 'react-router-dom';

export const Services = () => {
  return (
    <section className="seccion seccion-blanca">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div className="encabezado-servicios">
          <h2 className="titulo-servicios">NUESTROS SERVICIOS</h2>
        </div>

        <div className="grid-4">
          
          {/* Tarjeta 1 */}
          <div className="tarjeta-servicio">
            <div className="icono-servicio">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
              </svg>
            </div>
            <h3 className="titulo-servicio">Procesos<br/>académicos</h3>
            <p className="texto-servicio">
              Reingreso, ingreso por equivalencia, solicitud de examen complementario y documentos, cambio de carrera, etc.
            </p>
            <Link to="/login" className="link-servicio">ACCEDER {'>'}</Link>
          </div>

          {/* Tarjeta 2 */}
          <div className="tarjeta-servicio">
            <div className="icono-servicio">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
                <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
              </svg>
            </div>
            <h3 className="titulo-servicio">Colecturía</h3>
            <p className="texto-servicio">
              Todos tus pagos de manera presencial o en un solo click, desde cualquier sitio de forma segura.
            </p>
            <Link to="/login" className="link-servicio">ACCEDER {'>'}</Link>
          </div>

          {/* Tarjeta 3 */}
          <div className="tarjeta-servicio">
            <div className="icono-servicio">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path d="M6 16.5A3.5 3.5 0 018.5 10H9a5.5 5.5 0 1110.5 2.5h.5a3.5 3.5 0 010 7h-14z" />
              </svg>
            </div>
            <h3 className="titulo-servicio">Plataforma<br/>Virtual</h3>
            <p className="texto-servicio">
              Ingresa a la plataforma de aulas virtuales y recursos digitales del Colegio Salesiano San José.
            </p>
            <Link to="/login" className="link-servicio">ACCEDER {'>'}</Link>
          </div>

          {/* Tarjeta 4 */}
          <div className="tarjeta-servicio">
            <div className="icono-servicio">
              <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <h3 className="titulo-servicio">Contactos</h3>
            <p className="texto-servicio">
              Número de teléfono y correo electrónico de nuestras facultades, coordinaciones y unidades.
            </p>
            <a href="#contacto" className="link-servicio">ACCEDER {'>'}</a>
          </div>

        </div>
      </div>
    </section>
  );
};