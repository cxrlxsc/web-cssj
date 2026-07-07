import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumnoService } from '../../services/alumnoService';
import type { AlumnoReingreso } from '../../types/reingreso';

// Estilos reutilizables para mantener el código limpio
const sectionStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' };
const headerStyle = { color: '#0068B3', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' as const };
const readonlyInputStyle = { ...inputStyle, background: '#f8fafc', color: '#94a3b8' };

export const FormularioReingreso = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<AlumnoReingreso | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const sessionCarnet = localStorage.getItem('studentSession');
    if (!sessionCarnet) {
      navigate('/reingreso/login');
      return;
    }
    // Cargamos el expediente real desde Firebase (colección 'alumnos')
    alumnoService.getAlumno(sessionCarnet).then(alumno => {
      if (!alumno) {
        localStorage.removeItem('studentSession');
        navigate('/reingreso/login');
      } else {
        setStudent(alumno);
      }
    }).catch(() => {
      navigate('/reingreso/login');
    });
  }, [navigate]);

  if (!student) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando expediente...</div>;

  const handleLogout = () => {
    localStorage.removeItem('studentSession');
    navigate('/reingreso/login');
  };

  // Al confirmar, guardamos los datos ratificados/actualizados en Firebase y avanzamos a los pasos de pago.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (key: string) => ((fd.get(key) as string) || '').trim();

    const cambios: Partial<AlumnoReingreso> = {
      nie: v('nie'),
      nombres: v('nombres'),
      apellidos: v('apellidos'),
      sexo: v('sexo'),
      fechaNac: v('fechaNac'),
      nacionalidad: v('nacionalidad'),
      zona: v('zona'),
      departamento: v('departamento'),
      municipio: v('municipio'),
      telefono: v('telefono'),
      direccion: v('direccion'),
      viveCon: v('viveCon'),
      religion: v('religion'),
      tipoSangre: v('tipoSangre'),
      enfermedades: v('enfermedades'),
      alergias: v('alergias'),
      bautizado: v('bautizado'),
      confirmado: v('confirmado'),
      comunion: v('comunion'),
      cursoParvularia: v('cursoParvularia'),
      centroProcedencia: v('centroProcedencia'),
      padre: {
        ...student.padre,
        nombre: v('padre.nombre'),
        lugarTrabajo: v('padre.lugarTrabajo'),
        telefonoTrabajo: v('padre.telefonoTrabajo'),
        profesion: v('padre.profesion'),
        cargo: v('padre.cargo'),
        telefonoFijo: v('padre.telefonoFijo'),
        telefonoMovil: v('padre.telefonoMovil'),
        email: v('padre.email'),
        religion: v('padre.religion'),
      },
      madre: {
        ...student.madre,
        nombre: v('madre.nombre'),
        lugarTrabajo: v('madre.lugarTrabajo'),
        telefonoTrabajo: v('madre.telefonoTrabajo'),
        profesion: v('madre.profesion'),
        cargo: v('madre.cargo'),
        telefonoFijo: v('madre.telefonoFijo'),
        telefonoMovil: v('madre.telefonoMovil'),
        email: v('madre.email'),
        religion: v('madre.religion'),
      },
      responsable: v('responsable'),
      emergencia: {
        llamarA: v('emergencia.llamarA'),
        telefono: v('emergencia.telefono'),
      },
      encargado: {
        ...student.encargado,
        nombre: v('encargado.nombre'),
        lugarTrabajo: v('encargado.lugarTrabajo'),
        telefonoTrabajo: v('encargado.telefonoTrabajo'),
        profesion: v('encargado.profesion'),
        cargo: v('encargado.cargo'),
        telefonoFijo: v('encargado.telefonoFijo'),
        telefonoMovil: v('encargado.telefonoMovil'),
        email: v('encargado.email'),
        religion: v('encargado.religion'),
      },
      transporte: {
        ...student.transporte,
        tipo: v('transporte.tipo'),
        nombreMotorista: v('transporte.nombreMotorista'),
        placa: v('transporte.placa'),
        telefonoMotorista: v('transporte.telefonoMotorista'),
      },
      facturacion: {
        ...student.facturacion,
        nombreCompleto: v('facturacion.nombreCompleto'),
        direccion: v('facturacion.direccion'),
        telefono: v('facturacion.telefono'),
        email: v('facturacion.email'),
        dui: v('facturacion.dui'),
        nit: v('facturacion.nit'),
        profesion: v('facturacion.profesion'),
        parentesco: v('facturacion.parentesco'),
      },
    };

    setSaving(true);
    setSaveError('');
    try {
      await alumnoService.ratificarDatos(student.carnet, cambios);
      navigate('/reingreso/pasos');
    } catch {
      setSaveError('No se pudieron guardar los cambios. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER PRINCIPAL */}
      <div style={{ background: '#008C5A', color: 'white', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Ratificación de Matrícula 2026</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Verifica y actualiza tu información</p>
        </div>
        <div style={{ background: 'white', color: '#008C5A', padding: '1rem 1.5rem', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Grado a cursar:</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{student.gradoMatricular}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* === 1. DATOS DEL ALUMNO === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos del Alumno</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Carnet</label><input type="text" defaultValue={student.carnet} readOnly style={readonlyInputStyle} /></div>
            <div><label style={labelStyle}>Año de Ingreso</label><input type="text" defaultValue={student.anioIngreso} readOnly style={readonlyInputStyle} /></div>
            <div><label style={labelStyle}>Grado Actual</label><input type="text" defaultValue={student.gradoActual} readOnly style={readonlyInputStyle} /></div>
            <div><label style={labelStyle}>NIE</label><input type="text" name="nie" defaultValue={student.nie} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nombres</label><input type="text" name="nombres" defaultValue={student.nombres} style={inputStyle} /></div>
            <div><label style={labelStyle}>Apellidos</label><input type="text" name="apellidos" defaultValue={student.apellidos} style={inputStyle} /></div>
            <div><label style={labelStyle}>Sexo</label><select name="sexo" defaultValue={student.sexo} style={inputStyle}><option>MASCULINO</option><option>FEMENINO</option></select></div>
            <div><label style={labelStyle}>Fecha de Nac.</label><input type="date" name="fechaNac" defaultValue={student.fechaNac} style={inputStyle} /></div>
            <div><label style={labelStyle}>Nacionalidad</label><input type="text" name="nacionalidad" defaultValue={student.nacionalidad} style={inputStyle} /></div>
            <div><label style={labelStyle}>Zona</label><select name="zona" defaultValue={student.zona} style={inputStyle}><option>URBANA</option><option>RURAL</option></select></div>
            <div><label style={labelStyle}>Departamento</label><input type="text" name="departamento" defaultValue={student.departamento} style={inputStyle} /></div>
            <div><label style={labelStyle}>Municipio</label><input type="text" name="municipio" defaultValue={student.municipio} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" name="telefono" defaultValue={student.telefono} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Dirección</label><input type="text" name="direccion" defaultValue={student.direccion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Vive con</label><select name="viveCon" defaultValue={student.viveCon} style={inputStyle}><option>AMBOS PADRES</option><option>PADRE</option><option>MADRE</option><option>ENCARGADO</option></select></div>
            <div><label style={labelStyle}>Religión</label><input type="text" name="religion" defaultValue={student.religion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Tipo de Sangre</label><input type="text" name="tipoSangre" defaultValue={student.tipoSangre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Enfermedades</label><input type="text" name="enfermedades" defaultValue={student.enfermedades} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Alergias</label><input type="text" name="alergias" defaultValue={student.alergias} style={inputStyle} /></div>
            <div><label style={labelStyle}>Bautizado</label><select name="bautizado" defaultValue={student.bautizado} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>Confirmado</label><select name="confirmado" defaultValue={student.confirmado} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>Comunión</label><select name="comunion" defaultValue={student.comunion} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div><label style={labelStyle}>¿Cursó Parvularia?</label><select name="cursoParvularia" defaultValue={student.cursoParvularia} style={inputStyle}><option>SI</option><option>NO</option></select></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Centro Educativo de Procedencia</label><input type="text" name="centroProcedencia" defaultValue={student.centroProcedencia} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 2. DATOS DEL PADRE DE FAMILIA === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos del Padre de Familia</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" name="padre.nombre" defaultValue={student.padre.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" name="padre.lugarTrabajo" defaultValue={student.padre.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" name="padre.telefonoTrabajo" defaultValue={student.padre.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" name="padre.profesion" defaultValue={student.padre.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" name="padre.cargo" defaultValue={student.padre.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Fijo</label><input type="text" name="padre.telefonoFijo" defaultValue={student.padre.telefonoFijo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" name="padre.telefonoMovil" defaultValue={student.padre.telefonoMovil} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Correo Electrónico</label><input type="email" name="padre.email" defaultValue={student.padre.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>Religión</label><input type="text" name="padre.religion" defaultValue={student.padre.religion} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 3. DATOS DE LA MADRE DE FAMILIA === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos de la Madre de Familia</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" name="madre.nombre" defaultValue={student.madre.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" name="madre.lugarTrabajo" defaultValue={student.madre.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" name="madre.telefonoTrabajo" defaultValue={student.madre.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" name="madre.profesion" defaultValue={student.madre.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" name="madre.cargo" defaultValue={student.madre.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Fijo</label><input type="text" name="madre.telefonoFijo" defaultValue={student.madre.telefonoFijo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" name="madre.telefonoMovil" defaultValue={student.madre.telefonoMovil} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Correo Electrónico</label><input type="email" name="madre.email" defaultValue={student.madre.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>Religión</label><input type="text" name="madre.religion" defaultValue={student.madre.religion} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 4. EMERGENCIA Y ENCARGADO === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Responsable y Emergencias</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Responsable</label><select name="responsable" defaultValue={student.responsable} style={inputStyle}><option>EL PADRE</option><option>LA MADRE</option><option>AMBOS PADRES</option><option>AMBOS</option><option>OTRO</option></select></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Llamar en caso de Emergencia a</label><input type="text" name="emergencia.llamarA" defaultValue={student.emergencia.llamarA} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" name="emergencia.telefono" defaultValue={student.emergencia.telefono} style={inputStyle} /></div>
          </div>

          <h4 style={{ marginTop: '2rem', color: '#334155', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem' }}>Datos del Encargado (Llenar solo si no son los padres)</h4>
          <div style={{ ...gridStyle, marginTop: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre</label><input type="text" name="encargado.nombre" defaultValue={student.encargado.nombre} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Lugar de Trabajo</label><input type="text" name="encargado.lugarTrabajo" defaultValue={student.encargado.lugarTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Trabajo</label><input type="text" name="encargado.telefonoTrabajo" defaultValue={student.encargado.telefonoTrabajo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión/Oficio</label><input type="text" name="encargado.profesion" defaultValue={student.encargado.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cargo</label><input type="text" name="encargado.cargo" defaultValue={student.encargado.cargo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Fijo</label><input type="text" name="encargado.telefonoFijo" defaultValue={student.encargado.telefonoFijo} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono Móvil</label><input type="text" name="encargado.telefonoMovil" defaultValue={student.encargado.telefonoMovil} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Correo Electrónico</label><input type="email" name="encargado.email" defaultValue={student.encargado.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>Religión</label><input type="text" name="encargado.religion" defaultValue={student.encargado.religion} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 5. TRANSPORTE === */}
        <section style={sectionStyle}>
          <h3 style={headerStyle}>Datos de Transporte del Alumno al Colegio</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Tipo de Transporte</label><select name="transporte.tipo" defaultValue={student.transporte.tipo} style={inputStyle}><option>VEHICULO PROPIO</option><option>TRANSPORTE ESCOLAR</option><option>MICROBUS ESCOLAR</option><option>TRANSPORTE PUBLICO</option><option>A PIE</option></select></div>
            <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#ef4444' }}>* Completar los campos de abajo solo si no es vehículo propio</div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Nombre del Motorista</label><input type="text" name="transporte.nombreMotorista" defaultValue={student.transporte.nombreMotorista} style={inputStyle} /></div>
            <div><label style={labelStyle}>Placa del Vehículo</label><input type="text" name="transporte.placa" defaultValue={student.transporte.placa} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono del Motorista</label><input type="text" name="transporte.telefonoMotorista" defaultValue={student.transporte.telefonoMotorista} style={inputStyle} /></div>
          </div>
        </section>

        {/* === 6. FACTURACIÓN === */}
        <section style={{ ...sectionStyle, borderTop: '4px solid #002a4a' }}>
          <h3 style={{ ...headerStyle, color: '#002a4a' }}>Datos para Generación de Facturas</h3>
          <div style={gridStyle}>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Sostenedor Económico</label><input type="text" name="facturacion.nombreCompleto" defaultValue={student.facturacion.nombreCompleto} style={inputStyle} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Dirección</label><input type="text" name="facturacion.direccion" defaultValue={student.facturacion.direccion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Teléfono</label><input type="text" name="facturacion.telefono" defaultValue={student.facturacion.telefono} style={inputStyle} /></div>
            <div><label style={labelStyle}>Correo Electrónico</label><input type="email" name="facturacion.email" defaultValue={student.facturacion.email} style={inputStyle} /></div>
            <div><label style={labelStyle}>DUI</label><input type="text" name="facturacion.dui" defaultValue={student.facturacion.dui} style={inputStyle} /></div>
            <div><label style={labelStyle}>NIT</label><input type="text" name="facturacion.nit" defaultValue={student.facturacion.nit} style={inputStyle} /></div>
            <div><label style={labelStyle}>Profesión u Oficio</label><input type="text" name="facturacion.profesion" defaultValue={student.facturacion.profesion} style={inputStyle} /></div>
            <div><label style={labelStyle}>Parentesco</label><input type="text" name="facturacion.parentesco" defaultValue={student.facturacion.parentesco} style={inputStyle} /></div>
          </div>
        </section>

        {saveError && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{saveError}</div>
        )}

        {/* === BOTONES === */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={handleLogout} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
          <button type="submit" disabled={saving} style={{ padding: '0.8rem 2rem', background: saving ? '#cbd5e1' : '#FAB529', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: saving ? 'wait' : 'pointer', fontSize: '1rem' }}>
            {saving ? 'Guardando…' : 'Confirmar y Actualizar Datos'}
          </button>
        </div>

      </form>
    </div>
  );
};
