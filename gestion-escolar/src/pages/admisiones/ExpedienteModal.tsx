// src/pages/admisiones/ExpedienteModal.tsx
import React from 'react';
import './ExpedienteModal.css';

interface ExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  admission: any;
}

export default function ExpedienteModal({ isOpen, onClose, onSave, admission }: ExpedienteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="expediente-overlay">
      <div className="expediente-modal modal-enter">
        
        {/* HEADER FIJO */}
        <div className="expediente-header">
          <div className="header-text">
            <h2>Ficha de Expediente Estudiantil</h2>
            <p>Complete cuidadosamente la información requerida por la institución.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-close-expediente" aria-label="Cerrar modal">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* BODY SCROLLABLE */}
        <div className="expediente-body">
          <form id="expedienteForm" onSubmit={onSave}>
            
            {/* 1. DATOS DEL ALUMNO */}
            <div className="form-section">
              <div className="section-header bg-blue">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" /></svg>
                <h3>1. Datos del Alumno</h3>
              </div>
              <div className="form-grid">
                <label>Nombres: <input type="text" defaultValue={admission?.studentFirstName} required /></label>
                <label>Apellidos: <input type="text" defaultValue={admission?.studentLastName} required /></label>
                <label>NIE: <input type="text" required /></label>
                <label>Sexo: 
                  <span className="custom-select-wrapper">
                    <select required>
                      <option value="">Seleccione...</option>
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                  </span>
                </label>
                <label>Fecha de Nac.: <input type="date" required /></label>
                <label>Nacionalidad: <input type="text" defaultValue="SALVADOREÑA" /></label>
                <label>Zona Residencial: 
                  <span className="custom-select-wrapper">
                    <select><option>URBANA</option><option>RURAL</option></select>
                  </span>
                </label>
                <label>Departamento: <input type="text" required /></label>
                <label>Municipio: <input type="text" required /></label>
                <label className="full-width">Dirección Completa: <input type="text" required /></label>
                <label>Teléfono: <input type="tel" /></label>
                <label>Vive con: 
                  <span className="custom-select-wrapper">
                    <select><option>AMBOS PADRES</option><option>SOLO MADRE</option><option>SOLO PADRE</option><option>OTROS</option></select>
                  </span>
                </label>
                <label>Religión: <input type="text" defaultValue="CRISTIANO CATOLICO" /></label>
                <label>Tipo de Sangre: <input type="text" /></label>
                <label>Enfermedades: <input type="text" placeholder="Ninguna" /></label>
                <label>Alergias: <input type="text" placeholder="Ninguna" /></label>
                
                {/* Sacramentos (Toggle Pills) */}
                <div className="sacramentos-row full-width">
                  <label className="toggle-pill-label">
                    Bautizado
                    <input type="checkbox" name="bautizado" value="SI" className="toggle-pill-input" />
                    <span className="toggle-pill">Sí</span>
                  </label>
                  <label className="toggle-pill-label">
                    Confirmado
                    <input type="checkbox" name="confirmado" value="SI" className="toggle-pill-input" />
                    <span className="toggle-pill">Sí</span>
                  </label>
                  <label className="toggle-pill-label">
                    Comunión
                    <input type="checkbox" name="comunion" value="SI" className="toggle-pill-input" />
                    <span className="toggle-pill">Sí</span>
                  </label>
                  <label className="toggle-pill-label">
                    ¿Cursó Parvularia?
                    <input type="checkbox" name="parvularia" value="SI" className="toggle-pill-input" />
                    <span className="toggle-pill">Sí</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. DATOS DEL PADRE */}
            <div className="form-section">
              <div className="section-header bg-gray">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
                <h3>2. Datos del Padre de Familia</h3>
              </div>
              <div className="form-grid">
                <label>Nombre: <input type="text" /></label>
                <label>Profesión/Oficio: <input type="text" /></label>
                <label>Lugar de Trabajo: <input type="text" /></label>
                <label>Cargo: <input type="text" /></label>
                <label>Teléfono Trabajo: <input type="tel" /></label>
                <label>Teléfono Fijo: <input type="tel" /></label>
                <label>Teléfono Móvil: <input type="tel" /></label>
                <label>Correo Electrónico: <input type="email" /></label>
                <label>Religión: <input type="text" defaultValue="CRISTIANO CATOLICO" /></label>
              </div>
            </div>

            {/* 3. DATOS DE LA MADRE */}
            <div className="form-section">
              <div className="section-header bg-gray">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
                <h3>3. Datos de la Madre de Familia</h3>
              </div>
              <div className="form-grid">
                <label>Nombre: <input type="text" /></label>
                <label>Profesión/Oficio: <input type="text" /></label>
                <label>Lugar de Trabajo: <input type="text" /></label>
                <label>Cargo: <input type="text" /></label>
                <label>Teléfono Trabajo: <input type="tel" /></label>
                <label>Teléfono Fijo: <input type="tel" /></label>
                <label>Teléfono Móvil: <input type="tel" /></label>
                <label>Correo Electrónico: <input type="email" /></label>
                <label>Religión: <input type="text" defaultValue="CRISTIANO CATOLICO" /></label>
              </div>
            </div>

            {/* RESPONSABILIDAD Y EMERGENCIA */}
            <div className="form-section border-green">
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 2fr 1fr' }}>
                <label>Responsable Legal: 
                  <span className="custom-select-wrapper">
                    <select required>
                      <option value="EL PADRE">EL PADRE</option>
                      <option value="LA MADRE">LA MADRE</option>
                      <option value="AMBOS">AMBOS</option>
                      <option value="EL ENCARGADO">EL ENCARGADO</option>
                    </select>
                  </span>
                </label>
                <label>Llamar en caso de Emergencia a: <input type="text" required /></label>
                <label>Teléfono Emergencia: <input type="tel" required /></label>
              </div>
            </div>

            {/* 4. DATOS DEL ENCARGADO */}
            <div className="form-section">
              <div className="section-header bg-gray">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <h3>4. Datos del Encargado (Opcional si vive con los padres)</h3>
              </div>
              <div className="form-grid">
                <label>Nombre: <input type="text" /></label>
                <label>Profesión/Oficio: <input type="text" /></label>
                <label>Lugar de Trabajo: <input type="text" /></label>
                <label>Cargo: <input type="text" /></label>
                <label>Teléfono Trabajo: <input type="tel" /></label>
                <label>Teléfono Fijo: <input type="tel" /></label>
                <label>Teléfono Móvil: <input type="tel" /></label>
                <label>Correo Electrónico: <input type="email" /></label>
                <label>Religión: <input type="text" defaultValue="CRISTIANO CATOLICO" /></label>
              </div>
            </div>

            {/* 5. TRANSPORTE */}
            <div className="form-section">
              <div className="section-header bg-blue">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                <h3>5. Datos de Transporte</h3>
              </div>
              <div className="form-grid">
                <label>Tipo de Transporte: 
                  <span className="custom-select-wrapper">
                    <select required>
                      <option>VEHICULO PROPIO</option>
                      <option>TRANSPORTE ESCOLAR (MICROBUS)</option>
                      <option>A PIE</option>
                      <option>TRANSPORTE PUBLICO</option>
                    </select>
                  </span>
                </label>
                <label>Nombre del Motorista: <input type="text" /></label>
                <label>Placa del Vehículo: <input type="text" /></label>
                <label>Teléfono del Motorista: <input type="tel" /></label>
              </div>
            </div>

            {/* 6. FACTURACIÓN Y CONTRATO */}
            <div className="form-section highlight-facturacion">
              <div className="section-header bg-gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>
                <h3>6. Datos para Generación de Facturas y Contrato</h3>
              </div>
              <p className="facturacion-hint">Los siguientes datos aparecerán en los recibos del colegio y en el contrato de servicios educativos.</p>
              <div className="form-grid">
                <label className="full-width">Nombre Completo Sostenedor Económico: <input type="text" required /></label>
                <label className="full-width">Dirección: <input type="text" required /></label>
                <label>DUI: <input type="text" placeholder="00000000-0" required /></label>
                <label>NIT: <input type="text" placeholder="0000-000000-000-0" /></label>
                <label>Teléfono: <input type="tel" required /></label>
                <label>E-Mail: <input type="email" required /></label>
                <label>Profesión u Oficio: <input type="text" required /></label>
                <label>Parentesco: <input type="text" required /></label>
              </div>
            </div>

          </form>
        </div>
        
        {/* FOOTER FIJO */}
        <div className="expediente-footer">
          <button type="button" onClick={onClose} className="btn-cancel-exp">
            Cancelar y Salir
          </button>
          <button type="submit" form="expedienteForm" className="btn-save-exp">
            Guardar Expediente y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}