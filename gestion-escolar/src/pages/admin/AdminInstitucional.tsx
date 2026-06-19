// src/pages/admin/AdminInstitucional.tsx
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './adminStyles/AdminInstitucional.css'; 

export default function AdminInstitucional() {
  const navigate = useNavigate();
  const [pestañaActiva, setPestañaActiva] = useState('identidad');

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  // ESTADOS Y LÓGICA: IDENTIDAD
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
      alert('Hubo un error al guardar.');
    } finally {
      setGuardandoIdentidad(false);
    }
  };

  // ESTADOS Y LÓGICA: CONTACTOS
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
      alert('Hubo un error al guardar los contactos.');
    } finally {
      setGuardandoContacto(false);
    }
  };

  // ESTADOS Y LÓGICA: NOTICIAS
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

  // ESTADOS Y LÓGICA: EVENTOS
  const [eventos, setEventos] = useState<any[]>([]);
  const [guardandoEvento, setGuardandoEvento] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', descripcion: '', fecha: '', categoria: 'Institucional' });

  const cargarEventos = async () => {
    const querySnapshot = await getDocs(collection(db, "eventos"));
    const lista: any[] = [];
    querySnapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    setEventos(lista);
  };

  useEffect(() => { cargarEventos(); }, []);

  const handleAgregarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoEvento(true);
    try {
      const dateObj = new Date(nuevoEvento.fecha + 'T12:00:00');
      const diaStr = String(dateObj.getDate()).padStart(2, '0');
      const mesStr = dateObj.toLocaleString('es-ES', { month: 'short' }).substring(0, 3);

      const eventoFinal = { ...nuevoEvento, dia: diaStr, mes: mesStr };
      await addDoc(collection(db, "eventos"), eventoFinal);
      alert('Evento publicado exitosamente');
      setNuevoEvento({ titulo: '', descripcion: '', fecha: '', categoria: 'Institucional' });
      cargarEventos();
    } catch (error) {
      alert('Error al publicar el evento');
    } finally {
      setGuardandoEvento(false);
    }
  };

  const handleEliminarEvento = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este evento?")) {
      await deleteDoc(doc(db, "eventos", id));
      cargarEventos();
    }
  };

  // ESTADOS Y LÓGICA: AUTORIDADES
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

  return (
    <div className="admin-institucional-layout">
      
      {/* NAVBAR OFICIAL */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="institucional-main">
        
        {/* HEADER */}
        <header className="institucional-header">
          <div className="header-titles">
            <h1>Gestor de Página Web</h1>
            <p>Control de contenidos y configuración del portal público.</p>
          </div>
          <Link to="/admin/dashboard" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver al Panel Central
          </Link>
        </header>

        {/* PESTAÑAS */}
        <div className="tabs-container">
          {[
            { id: 'identidad', label: 'Misión y Visión' },
            { id: 'contactos', label: 'Contacto y Dirección' },
            { id: 'noticias', label: 'Gestor de Noticias' },
            { id: 'eventos', label: 'Agenda de Eventos' },
            { id: 'autoridades', label: 'Directorio de Autoridades' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setPestañaActiva(tab.id)}
              className={`tab-button ${pestañaActiva === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENEDOR DE LA PESTAÑA ACTIVA */}
        <div className="content-card">
          
          {pestañaActiva === 'identidad' && (
            <form onSubmit={handleGuardarIdentidad} className="form-layout">
              <div className="form-group">
                <label style={{ color: '#0068B3' }}>Misión del Colegio:</label>
                <textarea value={mision} onChange={(e) => setMision(e.target.value)} rows={5} required />
              </div>
              <div className="form-group">
                <label style={{ color: '#008C5A' }}>Visión del Colegio:</label>
                <textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={5} required />
              </div>
              <button type="submit" disabled={guardandoIdentidad} className="btn-primary">
                {guardandoIdentidad ? 'Guardando en Firebase...' : 'Guardar Cambios de Identidad'}
              </button>
            </form>
          )}

          {pestañaActiva === 'contactos' && (
            <form onSubmit={handleGuardarContacto} className="form-layout">
              <div className="form-group">
                <label>Teléfono Principal:</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required placeholder="Ej. +503 2440-0000" />
              </div>
              <div className="form-group">
                <label>Correo Electrónico Oficial:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Ej. info@colegiosalesiano.edu.sv" />
              </div>
              <div className="form-group">
                <label>Dirección Física Completa:</label>
                <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} rows={3} required placeholder="Dirección completa del campus" />
              </div>
              <button type="submit" disabled={guardandoContacto} className="btn-primary" style={{ backgroundColor: '#0068B3', color: 'white' }}>
                {guardandoContacto ? 'Guardando...' : 'Actualizar Información de Contacto'}
              </button>
            </form>
          )}

          {pestañaActiva === 'noticias' && (
            <div className="grid-2-cols">
              <div>
                <h3 className="section-title">Redactar Noticia</h3>
                <form onSubmit={handleAgregarNoticia} className="form-layout">
                  <div className="form-group">
                    <label>Título de la noticia</label>
                    <input type="text" value={nuevaNoticia.titulo} onChange={(e) => setNuevaNoticia({...nuevaNoticia, titulo: e.target.value})} required />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Fecha</label>
                      <input type="text" value={nuevaNoticia.fecha} onChange={(e) => setNuevaNoticia({...nuevaNoticia, fecha: e.target.value})} required placeholder="Ej. 15 mayo, 2026" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Etiqueta</label>
                      <input type="text" value={nuevaNoticia.tag} onChange={(e) => setNuevaNoticia({...nuevaNoticia, tag: e.target.value})} required placeholder="Ej. Evento" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>URL de Imagen Portada</label>
                    <input type="url" value={nuevaNoticia.imagen} onChange={(e) => setNuevaNoticia({...nuevaNoticia, imagen: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Extracto o Resumen</label>
                    <textarea value={nuevaNoticia.extracto} onChange={(e) => setNuevaNoticia({...nuevaNoticia, extracto: e.target.value})} required rows={3} />
                  </div>
                  <button type="submit" disabled={guardandoNoticia} className="btn-primary" style={{ backgroundColor: '#008C5A', color: 'white' }}>Publicar Noticia</button>
                </form>
              </div>
              <div>
                <h3 className="section-title">Noticias Publicadas</h3>
                <div className="items-list">
                  {noticias.map((noticia) => (
                    <div key={noticia.id} className="list-item">
                      <img src={noticia.imagen} alt="miniatura" />
                      <div className="list-item-content">
                        <h4>{noticia.titulo}</h4>
                        <p>{noticia.fecha}</p>
                      </div>
                      <button onClick={() => handleEliminarNoticia(noticia.id)} className="btn-danger-icon" title="Eliminar">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pestañaActiva === 'eventos' && (
            <div className="grid-2-cols">
              <div>
                <h3 className="section-title">Agendar Evento</h3>
                <form onSubmit={handleAgregarEvento} className="form-layout">
                  <div className="form-group">
                    <label>Título del evento</label>
                    <input type="text" value={nuevoEvento.titulo} onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} required />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Fecha</label>
                      <input type="date" value={nuevoEvento.fecha} onChange={(e) => setNuevoEvento({...nuevoEvento, fecha: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Categoría</label>
                      <select value={nuevoEvento.categoria} onChange={(e) => setNuevoEvento({...nuevoEvento, categoria: e.target.value})}>
                        <option value="Académico">Académico</option>
                        <option value="Institucional">Institucional</option>
                        <option value="Pastoral">Pastoral</option>
                        <option value="Deportes">Deportes</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Descripción corta</label>
                    <textarea value={nuevoEvento.descripcion} onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})} required rows={3} />
                  </div>
                  <button type="submit" disabled={guardandoEvento} className="btn-primary">Agendar en Calendario</button>
                </form>
              </div>
              <div>
                <h3 className="section-title">Agenda Actual</h3>
                <div className="items-list">
                  {eventos.map((evento) => (
                    <div key={evento.id} className="list-item">
                      <div className="date-badge">
                        <span className="day">{evento.dia}</span>
                        <span className="month">{evento.mes}</span>
                      </div>
                      <div className="list-item-content">
                        <h4>{evento.titulo}</h4>
                        <p style={{ color: '#008C5A', fontWeight: 'bold' }}>{evento.categoria}</p>
                      </div>
                      <button onClick={() => handleEliminarEvento(evento.id)} className="btn-danger-icon">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {pestañaActiva === 'autoridades' && (
            <div className="grid-2-cols">
              <div>
                <h3 className="section-title">Registrar Autoridad</h3>
                <form onSubmit={handleAgregarAutoridad} className="form-layout">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" value={nuevaAutoridad.nombre} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, nombre: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Cargo (Ej. Rector General)</label>
                    <input type="text" value={nuevaAutoridad.cargo} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, cargo: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>URL de la Foto de Perfil</label>
                    <input type="url" value={nuevaAutoridad.imagen} onChange={(e) => setNuevaAutoridad({...nuevaAutoridad, imagen: e.target.value})} required />
                  </div>
                  <button type="submit" disabled={guardandoAutoridad} className="btn-primary" style={{ backgroundColor: '#0068B3', color: 'white' }}>Agregar al Directorio</button>
                </form>
              </div>
              <div>
                <h3 className="section-title">Directorio Actual</h3>
                <div className="items-list">
                  {autoridades.map((autoridad) => (
                    <div key={autoridad.id} className="list-item">
                      <img src={autoridad.imagen} alt="perfil" style={{ borderRadius: '50%' }} />
                      <div className="list-item-content">
                        <h4>{autoridad.nombre}</h4>
                        <p style={{ color: '#0068B3', fontWeight: 'bold' }}>{autoridad.cargo}</p>
                      </div>
                      <button onClick={() => handleEliminarAutoridad(autoridad.id)} className="btn-danger-icon">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}