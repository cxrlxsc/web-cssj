// src/pages/admin/AdminInstitucional.tsx
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { estiloPortada, COLOR_PORTADA_DEFAULT, type PortadaConfig } from '../../hooks/usePortada';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import './adminStyles/AdminInstitucional.css';

// Secciones del Gestor de Página Web. Cada una tiene un ícono y una
// descripción para que el menú lateral sea autoexplicativo.
const SECCIONES = [
  {
    id: 'identidad',
    label: 'Misión y Visión',
    descripcion: 'Edita el texto de la misión y la visión que aparecen en la página pública.',
    icono: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'contactos',
    label: 'Contacto y Dirección',
    descripcion: 'Actualiza el teléfono, correo y dirección física del colegio.',
    icono: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  },
  {
    id: 'noticias',
    label: 'Gestor de Noticias',
    descripcion: 'Publica y elimina las noticias que se muestran en el portal.',
    icono: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5',
  },
  {
    id: 'eventos',
    label: 'Agenda de Eventos',
    descripcion: 'Agenda los eventos y fechas del calendario académico.',
    icono: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  },
  {
    id: 'autoridades',
    label: 'Directorio de Autoridades',
    descripcion: 'Administra las autoridades y su cargo dentro del directorio.',
    icono: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
  {
    id: 'portadas',
    label: 'Portadas / Diseño',
    descripcion: 'Cambia el color o la imagen de fondo de las franjas superiores del sitio.',
    icono: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  },
];

// Franjas/portadas configurables del sitio público. El "id" debe coincidir
// con el que usa cada página en usePortada(...).
const PAGINAS_PORTADA: { id: string; nombre: string; tipo: 'franja' | 'imagen' }[] = [
  { id: 'nosotros', nombre: 'Acerca de Nosotros', tipo: 'franja' },
  { id: 'historia', nombre: 'Nuestra Historia', tipo: 'franja' },
  { id: 'autoridades', nombre: 'Autoridades', tipo: 'franja' },
  { id: 'ubicacion', nombre: 'Contáctanos / Ubicación', tipo: 'franja' },
  { id: 'mundo-salesiano', nombre: 'Mundo Salesiano', tipo: 'franja' },
  { id: 'modelo-educativo', nombre: 'Modelo Educativo', tipo: 'franja' },
  { id: 'directorio', nombre: 'Directorio Institucional', tipo: 'franja' },
  { id: 'noticias', nombre: 'Noticias y Eventos', tipo: 'franja' },
  { id: 'proceso-inscripcion', nombre: 'Proceso de Inscripción', tipo: 'franja' },
  { id: 'calendario-academico', nombre: 'Calendario Académico', tipo: 'franja' },
  { id: 'cta-inscripcion', nombre: 'Imagen de Inscripciones (Inicio)', tipo: 'imagen' },
];

export default function AdminInstitucional() {
  const navigate = useNavigate();
  const { confirm, alert, dialogs } = useAdminDialogs();
  const [pestañaActiva, setPestañaActiva] = useState('identidad');

  const handleLogout = async () => {
    await cerrarSesionAdmin();
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
      await alert({ title: 'Identidad actualizada', message: 'La misión y visión se guardaron con éxito.', tone: 'success' });
    } catch (error) {
      await alert({ title: 'Error', message: 'Hubo un error al guardar.', tone: 'error' });
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
      await alert({ title: 'Contacto actualizado', message: 'Los datos de contacto se guardaron correctamente.', tone: 'success' });
    } catch (error) {
      await alert({ title: 'Error', message: 'Hubo un error al guardar los contactos.', tone: 'error' });
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
      await alert({ title: 'Noticia publicada', message: 'La noticia se publicó exitosamente.', tone: 'success' });
      setNuevaNoticia({ titulo: '', fecha: '', extracto: '', imagen: '', tag: 'Noticia', visitas: '0 Visitas' });
      cargarNoticias();
    } catch (error) {
      await alert({ title: 'Error', message: 'Error al publicar la noticia.', tone: 'error' });
    } finally {
      setGuardandoNoticia(false);
    }
  };

  const handleEliminarNoticia = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar noticia', message: '¿Seguro que deseas eliminar esta noticia?', confirmLabel: 'Eliminar', tone: 'navy' });
    if (!ok) return;
    await deleteDoc(doc(db, "noticias", id));
    cargarNoticias();
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
      await alert({ title: 'Evento publicado', message: 'El evento se agendó exitosamente.', tone: 'success' });
      setNuevoEvento({ titulo: '', descripcion: '', fecha: '', categoria: 'Institucional' });
      cargarEventos();
    } catch (error) {
      await alert({ title: 'Error', message: 'Error al publicar el evento.', tone: 'error' });
    } finally {
      setGuardandoEvento(false);
    }
  };

  const handleEliminarEvento = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar evento', message: '¿Seguro que deseas eliminar este evento?', confirmLabel: 'Eliminar', tone: 'navy' });
    if (!ok) return;
    await deleteDoc(doc(db, "eventos", id));
    cargarEventos();
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
      await alert({ title: 'Autoridad agregada', message: 'La autoridad se agregó al directorio.', tone: 'success' });
      setNuevaAutoridad({ nombre: '', cargo: '', imagen: '' });
      cargarAutoridades();
    } catch (error) {
      await alert({ title: 'Error', message: 'Error al agregar la autoridad.', tone: 'error' });
    } finally {
      setGuardandoAutoridad(false);
    }
  };

  const handleEliminarAutoridad = async (id: string) => {
    const ok = await confirm({ title: 'Eliminar autoridad', message: '¿Seguro que deseas eliminar este registro?', confirmLabel: 'Eliminar', tone: 'navy' });
    if (!ok) return;
    await deleteDoc(doc(db, "autoridades", id));
    cargarAutoridades();
  };

  // ESTADOS Y LÓGICA: PORTADAS / DISEÑO
  const [portadas, setPortadas] = useState<Record<string, PortadaConfig>>({});
  const [guardandoPortadas, setGuardandoPortadas] = useState(false);
  // id de la portada que está subiendo una imagen en este momento (para el spinner)
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null);

  useEffect(() => {
    const cargarPortadas = async () => {
      const docSnap = await getDoc(doc(db, 'institucional', 'portadas'));
      if (docSnap.exists()) setPortadas(docSnap.data() as Record<string, PortadaConfig>);
    };
    cargarPortadas();
  }, []);

  const actualizarPortada = (id: string, campo: keyof PortadaConfig, valor: string) => {
    setPortadas((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const handleSubirImagenPortada = async (id: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      await alert({ title: 'Archivo no válido', message: 'El archivo debe ser una imagen (JPG, PNG, etc.).', tone: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      await alert({ title: 'Imagen muy pesada', message: 'El máximo permitido es 5 MB.', tone: 'error' });
      return;
    }
    setSubiendoImagen(id);
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `portadas/${id}-${Date.now()}.${extension}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      actualizarPortada(id, 'imagen', url);
    } catch (error) {
      await alert({ title: 'Error', message: 'Hubo un error al subir la imagen. Intenta de nuevo.', tone: 'error' });
    } finally {
      setSubiendoImagen(null);
    }
  };

  const limpiarPortada = (id: string) => {
    setPortadas((prev) => ({ ...prev, [id]: {} }));
  };

  const handleGuardarPortadas = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPortadas(true);
    try {
      // Descartamos entradas vacías para no ensuciar el documento
      const limpio: Record<string, PortadaConfig> = {};
      Object.entries(portadas).forEach(([id, cfg]) => {
        const entrada: PortadaConfig = {};
        if (cfg?.color) entrada.color = cfg.color;
        if (cfg?.imagen) entrada.imagen = cfg.imagen;
        if (entrada.color || entrada.imagen) limpio[id] = entrada;
      });
      await setDoc(doc(db, 'institucional', 'portadas'), limpio);
      await alert({ title: 'Diseño actualizado', message: 'El diseño de portadas se guardó. Recarga el portal público para ver los cambios.', tone: 'success' });
    } catch (error) {
      await alert({ title: 'Error', message: 'Hubo un error al guardar el diseño.', tone: 'error' });
    } finally {
      setGuardandoPortadas(false);
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

        {/* CUERPO: MENÚ LATERAL + PANEL DE CONTENIDO */}
        <div className="institucional-body">

          {/* MENÚ LATERAL */}
          <aside className="institucional-sidebar">
            <span className="sidebar-titulo">Secciones</span>
            {SECCIONES.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setPestañaActiva(sec.id)}
                className={`sidebar-item ${pestañaActiva === sec.id ? 'active' : ''}`}
              >
                <span className="sidebar-icono">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={sec.icono} />
                  </svg>
                </span>
                <span className="sidebar-label">{sec.label}</span>
              </button>
            ))}
          </aside>

          {/* PANEL DE CONTENIDO */}
          <div className="institucional-panel">

            {/* Encabezado de la sección activa */}
            {SECCIONES.filter((s) => s.id === pestañaActiva).map((sec) => (
              <div key={sec.id} className="panel-encabezado">
                <span className="panel-encabezado-icono">
                  <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={sec.icono} />
                  </svg>
                </span>
                <div>
                  <h2>{sec.label}</h2>
                  <p>{sec.descripcion}</p>
                </div>
              </div>
            ))}

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
                        <option value="Asueto">Asueto / Receso</option>
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

          {pestañaActiva === 'portadas' && (
            <div>
              <div className="aviso-portadas">
                <strong>Personaliza las franjas superiores de cada página.</strong> Cambia el
                color de fondo o coloca una imagen (pega la URL de la foto). Si dejas todo vacío,
                se usará el diseño verde original con puntos.
              </div>

              <form onSubmit={handleGuardarPortadas} className="portadas-grid">
                {PAGINAS_PORTADA.map((pagina) => {
                  const cfg = portadas[pagina.id] || {};
                  return (
                    <div key={pagina.id} className="portada-card">
                      {/* Vista previa en vivo */}
                      <div
                        className="portada-preview"
                        style={
                          pagina.tipo === 'imagen'
                            ? {
                                backgroundImage: cfg.imagen ? `url("${cfg.imagen}")` : 'none',
                                backgroundColor: cfg.imagen ? undefined : '#e2e8f0',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }
                            : estiloPortada(
                                cfg.color || cfg.imagen ? cfg : { color: COLOR_PORTADA_DEFAULT }
                              )
                        }
                      >
                        <span>{pagina.nombre}</span>
                      </div>

                      <div className="portada-controles">
                        {pagina.tipo === 'franja' && (
                          <div className="portada-campo">
                            <label>Color de fondo</label>
                            <div className="color-input-row">
                              <input
                                type="color"
                                value={cfg.color || COLOR_PORTADA_DEFAULT}
                                onChange={(e) => actualizarPortada(pagina.id, 'color', e.target.value)}
                              />
                              <span className="color-hex">{cfg.color || COLOR_PORTADA_DEFAULT}</span>
                            </div>
                          </div>
                        )}

                        <div className="portada-campo">
                          <label>{pagina.tipo === 'imagen' ? 'Imagen' : 'Imagen de fondo (opcional)'}</label>

                          <label className={`btn-subir-portada ${subiendoImagen === pagina.id ? 'subiendo' : ''}`}>
                            {subiendoImagen === pagina.id ? (
                              'Subiendo...'
                            ) : (
                              <>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                {cfg.imagen ? 'Cambiar imagen' : 'Subir imagen'}
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              disabled={subiendoImagen === pagina.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleSubirImagenPortada(pagina.id, file);
                                e.target.value = ''; // permite volver a elegir el mismo archivo
                              }}
                            />
                          </label>

                          {cfg.imagen && (
                            <a href={cfg.imagen} target="_blank" rel="noopener noreferrer" className="portada-ver-imagen">
                              Ver imagen actual
                            </a>
                          )}

                          <details className="portada-url-avanzado">
                            <summary>O pegar una URL</summary>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={cfg.imagen || ''}
                              onChange={(e) => actualizarPortada(pagina.id, 'imagen', e.target.value)}
                            />
                          </details>
                        </div>

                        <button
                          type="button"
                          className="btn-reset-portada"
                          onClick={() => limpiarPortada(pagina.id)}
                        >
                          Restablecer
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="portadas-guardar">
                  <button type="submit" disabled={guardandoPortadas} className="btn-primary">
                    {guardandoPortadas ? 'Guardando en Firebase...' : 'Guardar Diseño de Portadas'}
                  </button>
                </div>
              </form>
            </div>
          )}

            </div>{/* .content-card */}
          </div>{/* .institucional-panel */}
        </div>{/* .institucional-body */}
      </main>
      {dialogs}
    </div>
  );
}