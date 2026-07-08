// src/components/home/Contact.tsx
// Tarjetas de contacto del home. Los datos se administran desde el Gestor de
// Página Web (/admin/institucional → Contacto y Dirección).
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const Contact = () => {
  const [contacto, setContacto] = useState({
    direccion: 'Santa Ana, El Salvador, C.A.',
    telefono: '+503 2440-0000',
    email: 'info@salesianosanjose.edu.sv',
  });

  useEffect(() => {
    getDoc(doc(db, 'institucional', 'contactos')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setContacto(prev => ({
          direccion: data.direccion || prev.direccion,
          telefono: data.telefono || prev.telefono,
          email: data.email || prev.email,
        }));
      }
    }).catch(() => { /* se muestran los valores por defecto */ });
  }, []);

  return (
    <section className="seccion seccion-gris">
      <div className="grid-3" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-azul" style={{ margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          </div>
          <h3 className="titulo-tarjeta">Ubicación</h3>
          <p className="texto-tarjeta">{contacto.direccion}</p>
        </div>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-verde" style={{ margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
          </div>
          <h3 className="titulo-tarjeta">Teléfono</h3>
          <p className="texto-tarjeta">{contacto.telefono}</p>
        </div>
        <div className="tarjeta">
          <div className="icono-tarjeta icono-amarillo" style={{ margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
          </div>
          <h3 className="titulo-tarjeta">Correo</h3>
          <p className="texto-tarjeta">{contacto.email}</p>
        </div>
      </div>
    </section>
  );
};
