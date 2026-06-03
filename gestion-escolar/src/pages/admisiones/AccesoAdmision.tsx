// src/pages/admisiones/AccesoAdmision.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Admisiones.css';

export default function AccesoAdmision() {
  const [codigo, setCodigo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí validaremos el código
    console.log('Verificando código:', codigo);
  };

  return (
    <div className="admision-layout">
      
      <div className="admision-content-wrapper">
        
        {/* Encabezado Institucional */}
        <div className="admision-header">
          <div className="admision-icon-circle">
            <svg width="45" height="45" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <h1>Colegio Salesiano San José</h1>
          <p>Solicitud de Admisión</p>
        </div>

        {/* Tarjeta de Formulario Premium */}
        <div className="admision-card">
          <h2>Ingrese su código de acceso</h2>
          <p className="instrucciones">
            Para iniciar el proceso de admisión en línea, por favor ingrese el código que le fue proporcionado por la institución.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="codigo">Código de Acceso</label>
              <input 
                type="text" 
                id="codigo" 
                placeholder="CSSJ25-XXXX" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                autoComplete="off"
              />
            </div>

            <button type="submit" className="btn-verificar">
              Verificar Código
            </button>
          </form>

          {/* Información de contacto */}
          <div className="admision-footer">
            <p>¿Aún no tiene un código asignado?</p>
            <div className="admision-contact">
              <span>
                <svg width="18" height="18" fill="none" stroke="#008C5A" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 1.892a15.84 15.84 0 01-6.502-6.502l1.892-1.514c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                2486 0801
              </span>
              <span>|</span>
              <span>
                <svg width="18" height="18" fill="none" stroke="#0068B3" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                admisiones@salesianosanjose.edu.sv
              </span>
            </div>
          </div>
        </div>

        {/* Link para regresar */}
        <Link to="/" className="link-volver">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Volver al inicio
        </Link>

      </div>
    </div>
  );
}