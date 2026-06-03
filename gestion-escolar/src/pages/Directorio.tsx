// src/pages/Directorio.tsx
import { useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './Directorio.css';

export default function Directorio() {
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Listado base del directorio institucional organizado de manera limpia
  const departamentos = [
    {
      nombre: "Dirección",
      encargado: "Dirección General",
      email: "direccion@salesianosanjose.edu.sv",
      extension: "Ext. 101",
      horario: "Lunes a Viernes: 7:00 AM - 3:30 PM",
      claseColor: "verde"
    },
    {
      nombre: "Registro Académico",
      encargado: "Control de Notas y Admisiones",
      email: "registro@salesianosanjose.edu.sv",
      extension: "Ext. 104",
      horario: "Lunes a Viernes: 7:30 AM - 4:00 PM",
      claseColor: "azul"
    },
    {
      nombre: "Colecturía y Administración",
      encargado: "Gestión de Pagos y Facturación",
      email: "colecturia@salesianosanjose.edu.sv",
      extension: "Ext. 102",
      horario: "Lunes a Viernes: 7:00 AM - 4:00 PM",
      claseColor: "dorado"
    },
    {
      nombre: "Coordinación Académica Técnico",
      encargado: "Bachilleratos Técnicos Vocacionales",
      email: "coord.tecnica@salesianosanjose.edu.sv",
      extension: "Ext. 110",
      horario: "Lunes a Viernes: 7:00 AM - 3:30 PM",
      claseColor: "azul"
    },
    {
      nombre: "Coordinación de Pastoral",
      encargado: "Formación Espiritual y Grupos Juveniles",
      email: "pastoral@salesianosanjose.edu.sv",
      extension: "Ext. 115",
      horario: "Lunes a Viernes: 7:00 AM - 3:30 PM",
      claseColor: "dorado"
    },
    {
      nombre: "Departamento de Psicología",
      encargado: "Orientación Escolar y Apoyo al Estudiante",
      email: "psicologia@salesianosanjose.edu.sv",
      extension: "Ext. 108",
      horario: "Lunes a Viernes: 7:30 AM - 3:30 PM",
      claseColor: "verde"
    }
  ];

  return (
    <div className="directorio-page">
      <Navbar />

      {/* Banner Principal Estilo Home */}
      <section className="hero-directorio" data-aos="fade-in">
        <span className="badge-premium" data-aos="fade-down" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Canales Oficiales
        </span>
        <h1 className="titulo-directorio" data-aos="fade-up" data-aos-delay="100">
          Directorio <span style={{ color: '#FAB529' }}>Institucional</span>
        </h1>
        <p style={{ maxWidth: '650px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }} data-aos="fade-up" data-aos-delay="200">
          Comunícate directamente con el departamento correspondiente para agilizar tus trámites y consultas académicas.
        </p>
      </section>

      {/* Grid de Tarjetas Superpuestas */}
      <section className="seccion-directorio-content">
        <div className="grid-directorio">
          {departamentos.map((dept, index) => (
            <div 
              key={index} 
              className={`directorio-card ${dept.claseColor}`}
              data-aos="fade-up"
              data-aos-delay={index * 50}
            >
              {/* Encabezado Tarjeta */}
              <div className="directorio-card-header">
                <div className="icon-directorio-wrapper">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <h3>{dept.nombre}</h3>
                  <p className="directorio-encargado">{dept.encargado}</p>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div className="directorio-card-body">
                
                {/* Correo */}
                <div className="info-linea-item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  <span>{dept.email}</span>
                </div>

                {/* Extensión */}
                <div className="info-linea-item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3.75 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /></svg>
                  <span>Teléfono del Colegio: <strong>{dept.extension}</strong></span>
                </div>

                {/* Horario */}
                <div className="info-linea-item">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{dept.horario}</span>
                </div>

              </div>

            </div>
          ))}
        </div>
      </section>

      <div style={{ flex: 1 }}></div>
      <Footer />
    </div>
  );
}