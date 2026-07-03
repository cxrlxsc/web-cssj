// src/pages/admisiones/ExpedienteModal.tsx
import React, { useState } from 'react';
import './ExpedienteModal.css';

interface ExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  admission: any; // Datos traídos de Firebase
}

export default function ExpedienteModal({ isOpen, onClose, onSave, admission }: ExpedienteModalProps) {
  
  // 1. NORMALIZADOR DE PARENTESCO (Movido arriba)
  const rawRel = admission?.parentRelationship?.toUpperCase() || '';
  let relacionNormalizada = '';
  if (rawRel.includes('MADRE')) relacionNormalizada = 'MADRE';
  else if (rawRel.includes('PADRE')) relacionNormalizada = 'PADRE';
  else if (rawRel.includes('AMBOS')) relacionNormalizada = 'AMBOS';
  else if (rawRel) relacionNormalizada = 'ENCARGADO';

  // 2. DATOS YA GUARDADOS EN FIREBASE (para cuando el aspirante vuelve a "revisar datos")
  const saved: Record<string, any> = admission?.expedienteDigital || {};
  const sv = (name: string, fallback: any = '') => (saved[name] ?? fallback);

  // 3. ESTADOS DINÁMICOS (inicializados con lo ya guardado si existe)
  const [viveCon, setViveCon] = useState(saved.alumno_vive_con || 'AMBOS PADRES');
  const [tipoTransporte, setTipoTransporte] = useState(saved.transporte_tipo || 'VEHICULO PROPIO');
  // NUEVO ESTADO PARA ESCUCHAR EL SELECT DE RESPONSABLE
  const [responsableLegal, setResponsableLegal] = useState(saved.responsable_legal || relacionNormalizada || 'PADRE');

  if (!isOpen) return null;

  // Variables auxiliares para el nombre completo
  const parentFullName = admission?.parentFirstName && admission?.parentLastName 
    ? `${admission.parentFirstName} ${admission.parentLastName}` 
    : admission?.parentFirstName || '';

  // Control de visibilidad
  const mostrarPadre = viveCon === 'AMBOS PADRES' || viveCon === 'SOLO PADRE';
  const mostrarMadre = viveCon === 'AMBOS PADRES' || viveCon === 'SOLO MADRE';
  const mostrarDatosMotorista = tipoTransporte === 'TRANSPORTE ESCOLAR (MICROBUS)';

  // ... (deja tu función handleCopiarDatosEncargado intacta aquí) ...

  // ============================================================================
  // FUNCIÓN PARA AUTOCOMPLETAR LOS DATOS DEL ENCARGADO
  // ============================================================================
  const handleCopiarDatosEncargado = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seleccion = e.target.value;
    const form = document.getElementById('expedienteForm') as HTMLFormElement;
    if (!form) return;

    const setValue = (name: string, value: string) => {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      if (input) input.value = value;
    };
    const getValue = (name: string) => {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      return input ? input.value : '';
    };

    if (seleccion === 'PADRE') {
      setValue('encargado_nombre', getValue('padre_nombre'));
      setValue('encargado_profesion', getValue('padre_profesion'));
      setValue('encargado_lugar_trabajo', getValue('padre_lugar_trabajo'));
      setValue('encargado_cargo', getValue('padre_cargo'));
      setValue('encargado_tel_trabajo', getValue('padre_tel_trabajo'));
      setValue('encargado_tel_fijo', getValue('padre_tel_fijo'));
      setValue('encargado_tel_movil', getValue('padre_tel_movil'));
      setValue('encargado_email', getValue('padre_email'));
      setValue('encargado_religion', getValue('padre_religion') || 'CRISTIANO CATOLICO');
      setValue('encargado_parentesco', 'PADRE');
      
    } else if (seleccion === 'MADRE') {
      setValue('encargado_nombre', getValue('madre_nombre'));
      setValue('encargado_profesion', getValue('madre_profesion'));
      setValue('encargado_lugar_trabajo', getValue('madre_lugar_trabajo'));
      setValue('encargado_cargo', getValue('madre_cargo'));
      setValue('encargado_tel_trabajo', getValue('madre_tel_trabajo'));
      setValue('encargado_tel_fijo', getValue('madre_tel_fijo'));
      setValue('encargado_tel_movil', getValue('madre_tel_movil'));
      setValue('encargado_email', getValue('madre_email'));
      setValue('encargado_religion', getValue('madre_religion') || 'CRISTIANO CATOLICO');
      setValue('encargado_parentesco', 'MADRE');
      
    } else {
      setValue('encargado_nombre', '');
      setValue('encargado_profesion', '');
      setValue('encargado_lugar_trabajo', '');
      setValue('encargado_cargo', '');
      setValue('encargado_tel_trabajo', '');
      setValue('encargado_tel_fijo', '');
      setValue('encargado_tel_movil', '');
      setValue('encargado_email', '');
      setValue('encargado_religion', 'CRISTIANO CATOLICO');
      setValue('encargado_parentesco', '');
    }
  };

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
                <label>Nombres: <input type="text" name="alumno_nombres" defaultValue={sv('alumno_nombres', admission?.studentFirstName)} required /></label>
                <label>Apellidos: <input type="text" name="alumno_apellidos" defaultValue={sv('alumno_apellidos', admission?.studentLastName)} required /></label>
                <label>NIE: <input type="text" name="alumno_nie" defaultValue={sv('alumno_nie')} required /></label>
                <label>Sexo:
                  <span className="custom-select-wrapper">
                    <select name="alumno_sexo" defaultValue={sv('alumno_sexo')} required>
                      <option value="">Seleccione...</option>
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                  </span>
                </label>
                <label>Fecha de Nac.: <input type="date" name="alumno_fecha_nacimiento" defaultValue={sv('alumno_fecha_nacimiento')} required /></label>
                <label>Edad: <input type="number" name="alumno_edad" min="1" max="99" defaultValue={sv('alumno_edad')} required /></label>
                <label>Nacionalidad: <input type="text" name="alumno_nacionalidad" defaultValue={sv('alumno_nacionalidad', 'SALVADOREÑA')} /></label>
                <label>Zona Residencial:
                  <span className="custom-select-wrapper">
                    <select name="alumno_zona_residencial" defaultValue={sv('alumno_zona_residencial', 'URBANA')}><option>URBANA</option><option>RURAL</option></select>
                  </span>
                </label>
                <label>Departamento: <input type="text" name="alumno_departamento" defaultValue={sv('alumno_departamento')} required /></label>
                <label>Municipio: <input type="text" name="alumno_municipio" defaultValue={sv('alumno_municipio', admission?.municipio)} required /></label>
                <label className="full-width">Dirección Completa: <input type="text" name="alumno_direccion" defaultValue={sv('alumno_direccion')} required /></label>
                <label>Teléfono: <input type="tel" name="alumno_telefono" defaultValue={sv('alumno_telefono')} /></label>
                
                <label>Vive con: 
                  <span className="custom-select-wrapper">
                    <select name="alumno_vive_con" value={viveCon} onChange={(e) => setViveCon(e.target.value)}>
                      <option value="AMBOS PADRES">AMBOS PADRES</option>
                      <option value="SOLO MADRE">SOLO MADRE</option>
                      <option value="SOLO PADRE">SOLO PADRE</option>
                      <option value="OTROS">OTROS</option>
                    </select>
                  </span>
                </label>

                <label>Religión: <input type="text" name="alumno_religion" defaultValue={sv('alumno_religion', 'CRISTIANO CATOLICO')} /></label>
                <label>Tipo de Sangre: <input type="text" name="alumno_tipo_sangre" defaultValue={sv('alumno_tipo_sangre')} /></label>
                <label>Enfermedades: <input type="text" name="alumno_enfermedades" defaultValue={sv('alumno_enfermedades')} placeholder="Ninguna" /></label>
                <label>Alergias: <input type="text" name="alumno_alergias" defaultValue={sv('alumno_alergias')} placeholder="Ninguna" /></label>

                {/* Sacramentos */}
                <div className="sacramentos-row full-width">
                  <label className="toggle-pill-label">Bautizado<input type="checkbox" name="alumno_bautizado" value="SI" defaultChecked={saved.alumno_bautizado === 'SI'} className="toggle-pill-input" /><span className="toggle-pill">Sí</span></label>
                  <label className="toggle-pill-label">Confirmado<input type="checkbox" name="alumno_confirmado" value="SI" defaultChecked={saved.alumno_confirmado === 'SI'} className="toggle-pill-input" /><span className="toggle-pill">Sí</span></label>
                  <label className="toggle-pill-label">Comunión<input type="checkbox" name="alumno_comunion" value="SI" defaultChecked={saved.alumno_comunion === 'SI'} className="toggle-pill-input" /><span className="toggle-pill">Sí</span></label>
                  <label className="toggle-pill-label">¿Cursó Parvularia?<input type="checkbox" name="alumno_curso_parvularia" value="SI" defaultChecked={saved.alumno_curso_parvularia === 'SI'} className="toggle-pill-input" /><span className="toggle-pill">Sí</span></label>
                </div>
              </div>
            </div>

            {/* 2. DATOS DEL PADRE */}
            {mostrarPadre && (
              <div className="form-section fade-in">
                <div className="section-header bg-gray">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
                  <h3>2. Datos del Padre de Familia</h3>
                </div>
                <div className="form-grid">
                  <label>Nombre: <input type="text" name="padre_nombre" defaultValue={sv('padre_nombre', relacionNormalizada === 'PADRE' ? parentFullName : '')} /></label>
                  <label>Profesión/Oficio: <input type="text" name="padre_profesion" defaultValue={sv('padre_profesion')} /></label>
                  <label>Lugar de Trabajo: <input type="text" name="padre_lugar_trabajo" defaultValue={sv('padre_lugar_trabajo')} /></label>
                  <label>Cargo: <input type="text" name="padre_cargo" defaultValue={sv('padre_cargo')} /></label>
                  <label>Teléfono Trabajo: <input type="tel" name="padre_tel_trabajo" defaultValue={sv('padre_tel_trabajo')} /></label>
                  <label>Teléfono Fijo: <input type="tel" name="padre_tel_fijo" defaultValue={sv('padre_tel_fijo')} /></label>
                  <label>Teléfono Móvil: <input type="tel" name="padre_tel_movil" defaultValue={sv('padre_tel_movil', relacionNormalizada === 'PADRE' ? admission?.parentPhone : '')} /></label>
                  <label>Correo Electrónico: <input type="email" name="padre_email" defaultValue={sv('padre_email', relacionNormalizada === 'PADRE' ? admission?.parentEmail : '')} /></label>
                  <label>Religión: <input type="text" name="padre_religion" defaultValue={sv('padre_religion', 'CRISTIANO CATOLICO')} /></label>
                </div>
              </div>
            )}

            {/* 3. DATOS DE LA MADRE */}
            {mostrarMadre && (
              <div className="form-section fade-in">
                <div className="section-header bg-gray">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
                  <h3>{mostrarPadre ? '3' : '2'}. Datos de la Madre de Familia</h3>
                </div>
                <div className="form-grid">
                  <label>Nombre: <input type="text" name="madre_nombre" defaultValue={sv('madre_nombre', relacionNormalizada === 'MADRE' ? parentFullName : '')} /></label>
                  <label>Profesión/Oficio: <input type="text" name="madre_profesion" defaultValue={sv('madre_profesion')} /></label>
                  <label>Lugar de Trabajo: <input type="text" name="madre_lugar_trabajo" defaultValue={sv('madre_lugar_trabajo')} /></label>
                  <label>Cargo: <input type="text" name="madre_cargo" defaultValue={sv('madre_cargo')} /></label>
                  <label>Teléfono Trabajo: <input type="tel" name="madre_tel_trabajo" defaultValue={sv('madre_tel_trabajo')} /></label>
                  <label>Teléfono Fijo: <input type="tel" name="madre_tel_fijo" defaultValue={sv('madre_tel_fijo')} /></label>
                  <label>Teléfono Móvil: <input type="tel" name="madre_tel_movil" defaultValue={sv('madre_tel_movil', relacionNormalizada === 'MADRE' ? admission?.parentPhone : '')} /></label>
                  <label>Correo Electrónico: <input type="email" name="madre_email" defaultValue={sv('madre_email', relacionNormalizada === 'MADRE' ? admission?.parentEmail : '')} /></label>
                  <label>Religión: <input type="text" name="madre_religion" defaultValue={sv('madre_religion', 'CRISTIANO CATOLICO')} /></label>
                </div>
              </div>
            )}

{/* RESPONSABILIDAD Y EMERGENCIA */}
            <div className="form-section border-green">
              <div className="form-grid" style={{ gridTemplateColumns: responsableLegal === 'AMBOS' ? '1fr 1fr' : '1fr 2fr 1fr' }}>
                <label className={responsableLegal === 'AMBOS' ? 'full-width' : ''}>Responsable Legal: 
                  <span className="custom-select-wrapper">
                    <select 
                      name="responsable_legal" 
                      required 
                      value={responsableLegal}
                      onChange={(e) => setResponsableLegal(e.target.value)}
                    >
                      <option value="PADRE">PADRE</option>
                      <option value="MADRE">MADRE</option>
                      <option value="AMBOS">AMBOS</option>
                      <option value="ENCARGADO">ENCARGADO</option>
                    </select>
                  </span>
                </label>

                {/* MAGIA: Si eligen AMBOS, mostramos 2 contactos de emergencia */}
                {responsableLegal === 'AMBOS' ? (
                  <>
                    <label className="fade-in">Llamar en Emergencia a (Padre): <input type="text" name="emergencia_nombre_padre" defaultValue={sv('emergencia_nombre_padre', parentFullName)} required /></label>
                    <label className="fade-in">Teléfono Padre: <input type="tel" name="emergencia_telefono_padre" defaultValue={sv('emergencia_telefono_padre', admission?.parentPhone)} required /></label>
                    <label className="fade-in">Llamar en Emergencia a (Madre): <input type="text" name="emergencia_nombre_madre" defaultValue={sv('emergencia_nombre_madre')} placeholder="Nombre de la Madre" required /></label>
                    <label className="fade-in">Teléfono Madre: <input type="tel" name="emergencia_telefono_madre" defaultValue={sv('emergencia_telefono_madre')} placeholder="0000-0000" required /></label>
                  </>
                ) : (
                  <>
                    <label className="fade-in">Llamar en caso de Emergencia a: <input type="text" name="emergencia_nombre" defaultValue={sv('emergencia_nombre', parentFullName)} required /></label>
                    <label className="fade-in">Teléfono Emergencia: <input type="tel" name="emergencia_telefono" defaultValue={sv('emergencia_telefono', admission?.parentPhone)} required /></label>
                  </>
                )}
              </div>
            </div>

            {/* 4. DATOS DEL ENCARGADO */}
            <div className="form-section">
              <div className="section-header bg-gray">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <h3>Datos del Encargado (Opcional si vive con los padres)</h3>
              </div>
              
              <div className="form-grid">
                <label className="full-width" style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '1.5rem', marginBottom: '0.5rem' }}>
                  Autocompletar datos desde:
                  <span className="custom-select-wrapper" style={{ marginTop: '0.5rem', maxWidth: '300px' }}>
                    <select onChange={handleCopiarDatosEncargado} defaultValue="OTRO">
                      <option value="OTRO">Llenar manualmente (Otro)</option>
                      {mostrarPadre && <option value="PADRE">Copiar datos del Padre</option>}
                      {mostrarMadre && <option value="MADRE">Copiar datos de la Madre</option>}
                    </select>
                  </span>
                </label>

                <label>Nombre: <input type="text" name="encargado_nombre" defaultValue={sv('encargado_nombre', relacionNormalizada === 'ENCARGADO' ? parentFullName : '')} /></label>
                <label>Parentesco: <input type="text" name="encargado_parentesco" defaultValue={sv('encargado_parentesco', relacionNormalizada === 'ENCARGADO' ? rawRel : '')} /></label>
                <label>Profesión/Oficio: <input type="text" name="encargado_profesion" defaultValue={sv('encargado_profesion')} /></label>
                <label>Lugar de Trabajo: <input type="text" name="encargado_lugar_trabajo" defaultValue={sv('encargado_lugar_trabajo')} /></label>
                <label>Cargo: <input type="text" name="encargado_cargo" defaultValue={sv('encargado_cargo')} /></label>
                <label>Teléfono Trabajo: <input type="tel" name="encargado_tel_trabajo" defaultValue={sv('encargado_tel_trabajo')} /></label>
                <label>Teléfono Fijo: <input type="tel" name="encargado_tel_fijo" defaultValue={sv('encargado_tel_fijo')} /></label>
                <label>Teléfono Móvil: <input type="tel" name="encargado_tel_movil" defaultValue={sv('encargado_tel_movil', relacionNormalizada === 'ENCARGADO' ? admission?.parentPhone : '')} /></label>
                <label>Correo Electrónico: <input type="email" name="encargado_email" defaultValue={sv('encargado_email', relacionNormalizada === 'ENCARGADO' ? admission?.parentEmail : '')} /></label>
                <label>Religión: <input type="text" name="encargado_religion" defaultValue={sv('encargado_religion', 'CRISTIANO CATOLICO')} /></label>
              </div>
            </div>

            {/* 5. TRANSPORTE */}
            <div className="form-section">
              <div className="section-header bg-blue">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                <h3>Datos de Transporte</h3>
              </div>
              <div className="form-grid">
                <label>Tipo de Transporte: 
                  <span className="custom-select-wrapper">
                    <select 
                      name="transporte_tipo" 
                      required
                      value={tipoTransporte}
                      onChange={(e) => setTipoTransporte(e.target.value)}
                    >
                      <option value="VEHICULO PROPIO">VEHICULO PROPIO</option>
                      <option value="TRANSPORTE ESCOLAR (MICROBUS)">TRANSPORTE ESCOLAR (MICROBUS)</option>
                      <option value="A PIE">A PIE</option>
                      <option value="TRANSPORTE PUBLICO">TRANSPORTE PUBLICO</option>
                    </select>
                  </span>
                </label>
                
                {mostrarDatosMotorista && (
                  <>
                    <label className="fade-in">Nombre del Motorista: <input type="text" name="transporte_motorista" defaultValue={sv('transporte_motorista')} /></label>
                    <label className="fade-in">Placa del Vehículo: <input type="text" name="transporte_placa" defaultValue={sv('transporte_placa')} /></label>
                    <label className="fade-in">Teléfono del Motorista: <input type="tel" name="transporte_telefono" defaultValue={sv('transporte_telefono')} /></label>
                  </>
                )}
              </div>
            </div>

            {/* 6. FACTURACIÓN Y CONTRATO */}
            <div className="form-section highlight-facturacion">
              <div className="section-header bg-gold">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>
                <h3>Datos para Generación de Facturas y Contrato</h3>
              </div>
              <p className="facturacion-hint">Los siguientes datos aparecerán en los recibos del colegio y en el contrato de servicios educativos.</p>
              <div className="form-grid">
                <label className="full-width">Nombre Completo Sostenedor Económico: <input type="text" name="sostenedor_nombre" defaultValue={sv('sostenedor_nombre', parentFullName)} required /></label>
                <label className="full-width">Dirección: <input type="text" name="sostenedor_direccion" defaultValue={sv('sostenedor_direccion')} required /></label>
                <label>DUI: <input type="text" name="sostenedor_dui" defaultValue={sv('sostenedor_dui')} placeholder="00000000-0" required /></label>
                <label>NIT: <input type="text" name="sostenedor_nit" defaultValue={sv('sostenedor_nit')} placeholder="0000-000000-000-0" /></label>
                <label>Teléfono: <input type="tel" name="sostenedor_telefono" defaultValue={sv('sostenedor_telefono', admission?.parentPhone)} required /></label>
                <label>E-Mail: <input type="email" name="sostenedor_email" defaultValue={sv('sostenedor_email', admission?.parentEmail)} required /></label>
                <label>Profesión u Oficio: <input type="text" name="sostenedor_profesion" defaultValue={sv('sostenedor_profesion')} required /></label>
                <label>Parentesco: <input type="text" name="sostenedor_parentesco" defaultValue={sv('sostenedor_parentesco', relacionNormalizada)} required /></label>
                <label>Edad (Sostenedor): <input type="number" name="sostenedor_edad" min="18" max="99" defaultValue={sv('sostenedor_edad')} required /></label>
                <label>Estado Civil:
                  <span className="custom-select-wrapper">
                    <select name="sostenedor_estado_civil" defaultValue={sv('sostenedor_estado_civil', 'Casado/a')} required>
                      <option value="Casado/a">Casado/a</option>
                      <option value="Soltero/a">Soltero/a</option>
                      <option value="Divorciado/a">Divorciado/a</option>
                      <option value="Viudo/a">Viudo/a</option>
                      <option value="Acompañado/a">Acompañado/a</option>
                    </select>
                  </span>
                </label>
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