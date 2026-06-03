// src/pages/admin/AdminInstitucional.tsx
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AdminInstitucional() {
  // --- ESTADO PARA LAS PESTAÑAS ---
  // Agregamos 'eventos' a las opciones posibles
  const [pestañaActiva, setPestañaActiva] = useState('identidad');

  // ==========================================
  // ESTADOS Y LÓGICA: IDENTIDAD
  // ==========================================
  const [mision, setMision] = useState('');
  const [vision, setVision] = useState('');
  const [guardandoIdentidad, setGuardandoIdentidad] = useState(false);

  useEffect(() => {
    const cargarIdentidad = async () => {
      const docSnap = await getDoc(doc(db, 'institucional', 'info_general'));
      if (docSnap.exists()) {
        setMision(docSnap.data().mision || '');
        setVision(docSnap.data().vision || '');
      }
    };
    cargarIdentidad();
  }, []);

  const handleGuardarIdentidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoIdentidad(true);
    try {
      await setDoc(doc(db, 'institucional', 'info_general'), { mision, vision }, { merge: true });
      alert('¡Identidad actualizada con éxito!');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar.');
    } finally {
      setGuardandoIdentidad(false);
    }
  };


  // ==========================================
  // ESTADOS Y LÓGICA: CONTACTOS
  // ==========================================
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [guardandoContacto, setGuardandoContacto] = useState(false);

  useEffect(() => {
    const cargarContactos = async () => {
      const docSnap = await getDoc(doc(db, 'institucional', 'contactos'));
      if (docSnap.exists()) {
        setTelefono(docSnap.data().telefono || '');
        setEmail(docSnap.data().email || '');
        setDireccion(docSnap.data().direccion || '');
      }
    };
    cargarContactos();
  }, []);

  const handleGuardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoContacto(true);
    try {
      await setDoc(doc(db, 'institucional', 'contactos'), { telefono, email, direccion }, { merge: true });
      alert('¡Datos de contacto actualizados!');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar los contactos.');
    } finally {
      setGuardandoContacto(false);
    }
  };


  // ==========================================
  // ESTADOS Y LÓGICA: NOTICIAS
  // ==========================================
  const [noticias, setNoticias] = useState<any[]>([]);
  const [guardandoNoticia, setGuardandoNoticia] = useState(false);
  const [nuevaNoticia, setNuevaNoticia] = useState({ titulo: '', fecha: '', extracto: '', imagen: '', tag: 'Noticia', visitas: '0 Visitas' });

  const cargarNoticias = async () => {
    const querySnapshot = await getDocs(collection(db, "noticias"));
    const lista: any[] = [];
    querySnapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    setNoticias(lista);
  };

  useEffect(() => { cargarNoticias(); }, []);

  const handleAgregarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoNoticia(true);
    try {
      await addDoc(collection(db, "noticias"), nuevaNoticia);
      alert('Noticia publicada exitosamente');
      setNuevaNoticia({ titulo: '', fecha: '', extracto: '', imagen: '', tag: 'Noticia', visitas: '0 Visitas' });
      cargarNoticias();
    } catch (error) {
      alert('Error al publicar la noticia');
    } finally {
      setGuardandoNoticia(false);
    }
  };

  const handleEliminarNoticia = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar esta noticia?")) {
      await deleteDoc(doc(db, "noticias", id));
      cargarNoticias();
    }
  };


  // ==========================================
  // ESTADOS Y LÓGICA: EVENTOS (NUEVO)
  // ==========================================
  const [eventos, setEventos] = useState<any[]>([]);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', descripcion: '', fecha: '', categoria: 'Institucional' });

  const cargarEventos = async () => {
    const querySnapshot = await getDocs(collection(db, "eventos"));
    const lista: any[] = [];
    querySnapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    // Ordenar eventos por fecha ascendente para el panel
    lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    setEventos(lista);
  };

  useEffect(() => { cargarEventos(); }, []);

  const handleAgregarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoEvento(true);
    try {
      // Extraemos el día y el mes automáticamente de la fecha seleccionada
      const dateObj = new Date(nuevoEvento.fecha + 'T12:00:00'); // Evita desfase horario
      const diaStr = String(dateObj.getDate()).padStart(2, '0');
      const mesStr = dateObj.toLocaleString('es-ES', { month: 'short' }).substring(0, 3); // Ej. "jun"

      const eventoFinal = {
        ...nuevoEvento,
        dia: diaStr,
        mes: mesStr
      };

      await addDoc(collection(db, "eventos"), eventoFinal);
      alert('Evento publicado en la agenda exitosamente');
      setNuevoEvento({ titulo: '', descripcion: '', fecha: '', categoria: 'Institucional' });
      cargarEventos();
    } catch (error) {
      alert('Error al publicar el evento');
    } finally {
      setGuardandoEvento(false);
    }
  };

  const handleEliminarEvento = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este evento de la agenda?")) {
      await deleteDoc(doc(db, "eventos", id));
      cargarEventos();
    }
  };


  // ==========================================
  // ESTADOS Y LÓGICA: AUTORIDADES
  // ==========================================
  const [autoridades, setAutoridades] = useState<any[]>([]);
  const [guardandoAutoridad, setGuardandoAutoridad] = useState(false);
  const [nuevaAutoridad, setNuevaAutoridad] = useState({ nombre: '', cargo: '', imagen: '' });

  const cargarAutoridades = async () => {
    const querySnapshot = await getDocs(collection(db, "autoridades"));
    const lista: any[] = [];
    querySnapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    setAutoridades(lista);
  };

  useEffect(() => { cargarAutoridades(); }, []);

  const handleAgregarAutoridad = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoAutoridad(true);
    try {
      await addDoc(collection(db, "autoridades"), nuevaAutoridad);
      alert('Autoridad agregada exitosamente');
      setNuevaAutoridad({ nombre: '', cargo: '', imagen: '' });
      cargarAutoridades();
    } catch (error) {
      alert('Error al agregar autoridad');
    } finally {
      setGuardandoAutoridad(false);
    }
  };

  const handleEliminarAutoridad = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este registro?")) {
      await deleteDoc(doc(db, "autoridades", id));
      cargarAutoridades();
    }
  };


  // ==========================================
  // RENDERIZADO DE LA INTERFAZ
  // ==========================================
  return (
    <div style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      <h2 style={{ color: '#002a4a', fontSize: '2rem', marginBottom: '0.5rem' }}>Panel de Administración</h2>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Gestiona toda la información pública del colegio.</p>

      {/* Navegación por Pestañas */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'identidad', label: 'Misión/Visión' },
          { id: 'contactos', label: 'Información de Contacto' },
          { id: 'noticias', label: 'Gestor de Noticias' },
          { id: 'eventos', label: 'Gestor de Eventos' },
          { id: 'autoridades', label: 'Autoridades' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setPestañaActiva(tab.id)}
            style={{ 
              padding: '0.8rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer',
              backgroundColor: pestañaActiva === tab.id ? '#0068B3' : '#f1f5f9',
              color: pestañaActiva === tab.id ? 'white' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PESTAÑA IDENTIDAD */}
      {pestañaActiva === 'identidad' && (
        <form onSubmit={handleGuardarIdentidad} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: '#0068B3' }}>Misión del Colegio:</label>
            <textarea value={mision} onChange={(e) => setMision(e.target.value)} rows={5} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold', color: '#008C5A' }}>Visión del Colegio:</label>
            <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={5} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <button type="submit" disabled={guardandoIdentidad} style={{ backgroundColor: '#FAB529', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '8px', cursor: guardandoIdentidad ? 'not-allowed' : 'pointer' }}>
            {guardandoIdentidad ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      )}

      {/* PESTAÑA CONTACTOS */}
      {pestañaActiva === 'contactos' && (
        <form onSubmit={handleGuardarContacto} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>Teléfono Principal:</label>
            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Ej. +503 2440-0000" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>Correo Electrónico:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Ej. info@colegiosalesiano.edu.sv" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>Dirección Física:</label>
            <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} rows={3} required style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Dirección completa del campus" />
          </div>
          <button type="submit" disabled={guardandoContacto} style={{ backgroundColor: '#0068B3', color: 'white', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '8px', cursor: guardandoContacto ? 'not-allowed' : 'pointer' }}>
            {guardandoContacto ? 'Guardando...' : 'Guardar Contactos'}
          </button>
        </form>
      )}

      {/* PESTAÑA NOTICIAS */}
      {pestañaActiva === 'noticias' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <h3 style={{ color: '#008C5A', marginBottom: '1.5rem' }}>Publicar Nueva Noticia</h3>
            <form onSubmit={handleAgregarNoticia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input type="text" value={nuevaNoticia.titulo} onChange={(e) => setNuevaNoticia({...nuevaNoticia, titulo: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Título de la noticia" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" value={nuevaNoticia.fecha} onChange={(e) => setNuevaNoticia({...nuevaNoticia, fecha: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }} placeholder="Ej. 15 mayo, 2026" />
                <input type="text" value={nuevaNoticia.tag} onChange={(e) => setNuevaNoticia({...nuevaNoticia, tag: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }} placeholder="Etiqueta (Ej. Noticia)" />
              </div>
              <input type="url" value={nuevaNoticia.imagen} onChange={(e) => setNuevaNoticia({...nuevaNoticia, imagen: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="URL de la Imagen" />
              <textarea value={nuevaNoticia.extracto} onChange={(e) => setNuevaNoticia({...nuevaNoticia, extracto: e.target.value})} required rows={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Extracto (Resumen)..." />
              <button type="submit" disabled={guardandoNoticia} style={{ backgroundColor: '#008C5A', color: 'white', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '6px' }}>Publicar Noticia</button>
            </form>
          </div>
          <div>
            <h3 style={{ color: '#002a4a', marginBottom: '1.5rem' }}>Noticias Publicadas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
              {noticias.map((noticia) => (
                <div key={noticia.id} style={{ display: 'flex', gap: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={noticia.imagen} alt="miniatura" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{noticia.titulo}</h4>
                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#64748b' }}>{noticia.fecha}</p>
                  </div>
                  <button onClick={() => handleEliminarNoticia(noticia.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', alignSelf: 'flex-start' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA EVENTOS (NUEVA) */}
      {pestañaActiva === 'eventos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <h3 style={{ color: '#FAB529', marginBottom: '1.5rem' }}>Agendar Nuevo Evento</h3>
            <form onSubmit={handleAgregarEvento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              
              <input type="text" value={nuevoEvento.titulo} onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Título del evento" />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {/* Usamos type="date" para que salga el calendario nativo */}
                <input type="date" value={nuevoEvento.fecha} onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }} />
                
                <select value={nuevoEvento.categoria} onChange={(e) => setNuevoEvento({...nuevoEvento, categoria: e.target.value})} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1 }}>
                  <option value="Académico">Académico</option>
                  <option value="Institucional">Institucional</option>
                  <option value="Pastoral">Pastoral</option>
                  <option value="Deportes">Deportes</option>
                  <option value="Importante">Importante</option>
                </select>
              </div>

              <textarea value={nuevoEvento.descripcion} onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})} required rows={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Descripción corta del evento..." />
              
              <button type="submit" disabled={guardandoEvento} style={{ backgroundColor: '#FAB529', color: '#002a4a', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '6px', cursor: guardandoEvento ? 'not-allowed' : 'pointer' }}>
                {guardandoEvento ? 'Agendando...' : 'Agendar Evento'}
              </button>
            </form>
          </div>
          <div>
            <h3 style={{ color: '#002a4a', marginBottom: '1.5rem' }}>Agenda Actual</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
              {eventos.map((evento) => (
                <div key={evento.id} style={{ display: 'flex', gap: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                  <div style={{ backgroundColor: '#0068B3', color: 'white', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', minWidth: '50px' }}>
                    <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold' }}>{evento.dia}</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>{evento.mes}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', color: '#002a4a' }}>{evento.titulo}</h4>
                    <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#475569', fontWeight: 'bold' }}>{evento.categoria}</span>
                  </div>
                  <button onClick={() => handleEliminarEvento(evento.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA AUTORIDADES */}
      {pestañaActiva === 'autoridades' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <h3 style={{ color: '#0068B3', marginBottom: '1.5rem' }}>Registrar Autoridad</h3>
            <form onSubmit={handleAgregarAutoridad} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input type="text" value={nuevaAutoridad.nombre} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, nombre: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Nombre completo" />
              <input type="text" value={nuevaAutoridad.cargo} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, cargo: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="Cargo (Ej. Rector General)" />
              <input type="url" value={nuevaAutoridad.imagen} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, imagen: e.target.value})} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} placeholder="URL de la Foto de Perfil" />
              <button type="submit" disabled={guardandoAutoridad} style={{ backgroundColor: '#0068B3', color: 'white', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '6px' }}>Agregar Registro</button>
            </form>
          </div>
          <div>
            <h3 style={{ color: '#002a4a', marginBottom: '1.5rem' }}>Directorio Actual</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
              {autoridades.map((autoridad) => (
                <div key={autoridad.id} style={{ display: 'flex', gap: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                  <img src={autoridad.imagen} alt="perfil" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0', fontSize: '0.95rem' }}>{autoridad.nombre}</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#008C5A', fontWeight: 'bold' }}>{autoridad.cargo}</p>
                  </div>
                  <button onClick={() => handleEliminarAutoridad(autoridad.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer' }}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}