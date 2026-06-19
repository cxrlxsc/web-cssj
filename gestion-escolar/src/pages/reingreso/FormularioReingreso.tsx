import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockStudentDB } from '../../data/mockStudent';

// Estilos reutilizables para mantener el código limpio
const sectionStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' };
const headerStyle = { color: '#0068B3', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' as const };
const readonlyInputStyle = { ...inputStyle, background: '#f8fafc', color: '#94a3b8' };

export const FormularioReingreso = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const sessionCarnet = localStorage.getItem('studentSession');
    if (!sessionCarnet || !mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]) {
      navigate('/reingreso/login'); 
    } else {
      setStudent(mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]);
    }
  }, [navigate]);

  if (!student) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando expediente...</div>;

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/reingreso/login');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ background: '#008C5A', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Ratificación de Matrícula {student.anioIngreso}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Verifica y actualiza tu información</p>
        </div>
        <div style={{ background: 'white', color: '#008C5A', padding: '1rem 1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Grado a cursar:</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{student.gradoMatricular}</span>
        </div>
      </div>

        <form onSubmit={(e) => { e.preventDefault(); navigate('/reingreso/pasos'); }}>        
        {/* === 1. DATOS DEL ALUMNO === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos del Alumno</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Carnet</label><input type="text" defaultValue={student.carnet} readOnly style={readonlyInputStyle} /></div>
            <div><label style={labelStyle}>NIE</label><input type="text" defaultValue={student.nie} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nombres</label><input type="text" defaultValue={student.nombres} style={inputStyle} /></div>
            <div><label style={labelStyle}>Apellidos</label><input type="text" defaultValue={student.apellidos} style={inputStyle} /></div>
            <div><label style={labelStyle}>Sexo</label><select defaultValue={student.sexo} style={inputStyle}><option>MASCULINO</option><option>FEMENINO</option></select></div>
            <div><label style={labelStyle}>Fecha de Nac.</label><input type="date" defaultValue={student.fechaNac} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nacionalidad</label><input type="text" defaultValue={student.nacionalidad} style={inputStyle} /></div>
            <div><label style={labelStyle}>Zona</label><select defaultValue={student.zona} style={inputStyle}><option>URBANA</option><option>RURAL</option></select></div>
            <div><label style={labelStyle}>Departamento</label><input type="text" defaultValue={student.departamento} style={inputStyle} /></div>
            <div><label style={labelStyle}>Municipio</label><input type="text" defaultValue={student.municipio} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" defaultValue={student.telefono} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Dirección</label><input type="text" defaultValue={student.direccion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Vive con</label><select defaultValue={student.viveCon} style={inputStyle}><option>AMBOS PADRES</option><option>PADRE</option><option>MADRE</option><option>ENCARGADO</option></select></div>
            <div><label style={labelStyle}>Religión</label><input type="text" defaultValue={student.religion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Tipo de Sangre</label><input type="text" defaultValue={student.tipoSangre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Enfermedades</label><input type="text" defaultValue={student.enfermedades} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Alergias</label><input type="text" defaultValue={student.alergias} style={inputStyle} /></div>
            <div><label style={labelStyle}>Bautizado</label><select defaultValue={student.bautizado} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>Confirmado</label><select defaultValue={student.confirmado} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>Comunión</label><select defaultValue={student.comunion} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>¿Cursó Parvularia?</label><select defaultValue={student.cursoParvularia} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Centro Educativo de Procedencia</label><input type="text" defaultValue={student.centroProcedencia} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 2. DATOS DEL PADRE DE FAMILIA === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos del Padre de Familia</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" defaultValue={student.padre.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" defaultValue={student.padre.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" defaultValue={student.padre.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" defaultValue={student.padre.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" defaultValue={student.padre.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Fijo</label><input type="text" defaultValue={student.padre.telefonoFijo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" defaultValue={student.padre.telefonoMovil} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Correo Electrónico</label><input type="email" defaultValue={student.padre.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>Religión</label><input type="text" defaultValue={student.padre.religion} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 3. DATOS DE LA MADRE DE FAMILIA === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos de la Madre de Familia</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" defaultValue={student.madre.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" defaultValue={student.madre.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" defaultValue={student.madre.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" defaultValue={student.madre.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" defaultValue={student.madre.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Fijo</label><input type="text" defaultValue={student.madre.telefonoFijo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" defaultValue={student.madre.telefonoMovil} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Correo Electrónico</label><input type="email" defaultValue={student.madre.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>Religión</label><input type="text" defaultValue={student.madre.religion} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 4. EMERGENCIA Y ENCARGADO === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Responsable y Emergencias</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Responsable</label><select defaultValue={student.responsable} style={inputStyle}><option>EL PADRE</option><option>LA MADRE</option><option>AMBOS</option><option>OTRO</option></select></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Llamar en caso de Emergencia a</label><input type="text" defaultValue={student.emergencia.llamarA} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" defaultValue={student.emergencia.telefono} style={inputStyle} /></div>
          </div>
          
          <h4 style={{ marginTop: '2rem', color: '#334155', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>Datos del Encargado (Llenar solo si no son los padres)</h4>
          <div style={{ ...gridStyle, marginTop: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" defaultValue={student.encargado.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" defaultValue={student.encargado.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" defaultValue={student.encargado.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" defaultValue={student.encargado.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" defaultValue={student.encargado.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" defaultValue={student.encargado.telefonoMovil} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 5. TRANSPORTE === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos de Transporte del Alumno al Colegio</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Tipo de Transporte</label><select defaultValue={student.transporte.tipo} style={inputStyle}><option>VEHICULO PROPIO</option><option>MICROBUS ESCOLAR</option><option>TRANSPORTE PUBLICO</option><option>A PIE</option></select></div>
            <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#ef4444' }}>* Completar los campos de abajo solo si no es vehículo propio</div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre del Motorista</label><input type="text" defaultValue={student.transporte.nombreMotorista} style={inputStyle} /></div>
            <div><label style={labelStyle}>Placa del Vehículo</label><input type="text" defaultValue={student.transporte.placa} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Motorista</label><input type="text" defaultValue={student.transporte.telefonoMotorista} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 6. FACTURACIÓN === */}
        <section style={{ ...sectionStyle, borderTop: '4px solid #002a4a' }}>
          <h3 style={{ ...headerStyle, color: '#002a4a' }}>Datos para Generación de Facturas</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Sostenedor Económico</label><input type="text" defaultValue={student.facturacion.nombreCompleto} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Dirección</label><input type="text" defaultValue={student.facturacion.direccion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" defaultValue={student.facturacion.telefono} style={inputStyle} /></div>
            <div><label style={labelStyle}>Correo Electrónico</label><input type="email" defaultValue={student.facturacion.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>DUI</label><input type="text" defaultValue={student.facturacion.dui} style={inputStyle} /></div>
            <div><label style={labelStyle}>NIT</label><input type="text" defaultValue={student.facturacion.nit} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión u Oficio</label><input type="text" defaultValue={student.facturacion.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Parentesco</label><input type="text" defaultValue={student.facturacion.parentesco} style={inputStyle} /></div>
          </div>
        </section>

        {/* === BOTONES === */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={handleLogout} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
          <button type="submit" style={{ padding: '0.8rem 2rem', background: '#FAB529', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>Confirmar y Actualizar Datos</button>
        </div>

      </form>
    </div>
  );
};