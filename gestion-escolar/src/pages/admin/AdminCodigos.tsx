// src/pages/admin/AdminCodigos.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accessCodeService } from '../../services/accessCodeService';
import { configService } from '../../services/configService';
import logoImg from '../../assets/logo.png'; // Asegúrate de que esta ruta sea correcta
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import { useAdminDialogs } from '../../components/admin/useAdminDialogs';
import type { AccessCode } from '../../types';
import './adminStyles/AdminCodigos.css';

const DATOS_VACIOS = { applicantName: '', guardianName: '', guardianPhone: '', guardianEmail: '' };
const POR_PAGINA = 10;

export default function AdminCodigos() {
  const navigate = useNavigate();
  const { alert, dialogs } = useAdminDialogs();
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  // Pestaña activa: emitir un código nuevo o dar seguimiento a los emitidos.
  const [vista, setVista] = useState<'emitir' | 'seguimiento'>('emitir');

  // Datos del aspirante y su encargado, capturados ANTES de emitir el código.
  const [datos, setDatos] = useState(DATOS_VACIOS);

  // Listado de códigos ya emitidos (para ver quién los usó y cuándo).
  const [codigos, setCodigos] = useState<AccessCode[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  // Filtro de la lista: todos, solo los que faltan por usar, o solo los usados.
  const [filtro, setFiltro] = useState<'todos' | 'sin_usar' | 'usados'>('todos');
  // Página actual de la tabla de seguimiento (10 códigos por página).
  const [pagina, setPagina] = useState(1);

  // Año de matrícula del código: permite matrícula ordinaria (ciclo configurado)
  // o extraordinaria (un alumno que llega a mitad de año a matricularse al ciclo
  // en curso, o incluso adelantarse al siguiente). El año viaja con el código
  // hasta la admisión, el carnet (AÑO+GRADO+ORDEN) y el contrato.
  const [anioCodigo, setAnioCodigo] = useState<number>(new Date().getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);

  useEffect(() => {
    configService.getAnioMatricula().then(anioCiclo => {
      const anioActual = new Date().getFullYear();
      const opciones = Array.from(new Set([anioActual, anioCiclo, anioCiclo + 1])).sort();
      setAniosDisponibles(opciones);
      setAnioCodigo(anioCiclo); // por defecto, el ciclo configurado (matrícula ordinaria)
    }).catch(() => {
      const anioActual = new Date().getFullYear();
      setAniosDisponibles([anioActual, anioActual + 1]);
      setAnioCodigo(anioActual);
    });
  }, []);

  const cargarCodigos = async () => {
    setCargandoLista(true);
    try {
      const lista = await accessCodeService.getAllCodes();
      setCodigos(lista);
    } catch (error) {
      console.error('Error al cargar códigos:', error);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => { cargarCodigos(); }, []);

  // Al cambiar de filtro, volvemos a la primera página.
  useEffect(() => { setPagina(1); }, [filtro]);

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  const actualizarDato = (campo: keyof typeof DATOS_VACIOS, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleGenerarCodigo = async () => {
    // Validación: exigimos los datos del aspirante y encargado.
    if (!datos.applicantName.trim() || !datos.guardianName.trim() || !datos.guardianPhone.trim() || !datos.guardianEmail.trim()) {
      await alert({ title: 'Faltan datos', message: 'Completa el nombre del aspirante y los datos del encargado antes de generar el código.', tone: 'error' });
      return;
    }

    setGenerandoCodigo(true);
    try {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const nuevoCodigo = `CSSJ-${randomStr}`;

      await accessCodeService.createCode({
        code: nuevoCodigo,
        description: `Código para ${datos.applicantName.trim()} (matrícula ${anioCodigo})`,
        year: anioCodigo,
        maxUses: 1,
        currentUses: 0,
        isActive: true,
        gradeLevel: 'all',
        createdBy: 'admin_academico',
        creatorName: 'Administrador',
        assignedTo: {
          applicantName: datos.applicantName.trim(),
          guardianName: datos.guardianName.trim(),
          guardianPhone: datos.guardianPhone.trim(),
          guardianEmail: datos.guardianEmail.trim(),
        },
      } as any);

      setCodigoGenerado(nuevoCodigo);
      setDatos(DATOS_VACIOS); // limpiamos para el siguiente
      cargarCodigos();        // refrescamos la lista
    } catch (error) {
      console.error(error);
      await alert({ title: 'Error', message: 'Hubo un error al generar el código en Firebase.', tone: 'error' });
    } finally {
      setGenerandoCodigo(false);
    }
  };

  // ¿El código ya fue utilizado por un aspirante?
  const fueUsado = (c: AccessCode): boolean =>
    c.currentUses >= c.maxUses || (c.usedBy?.length ?? 0) > 0;

  // Calcula el estado visible de un código.
  const estadoDe = (c: AccessCode): { texto: string; clase: string } => {
    if (fueUsado(c)) return { texto: 'Usado', clase: 'usado' };
    if (!c.isActive) return { texto: 'Desactivado', clase: 'desactivado' };
    return { texto: 'Disponible', clase: 'disponible' };
  };

  const formatoFecha = (fecha: Date) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  // Conteos, filtrado y paginación para el apartado de seguimiento.
  const totalUsados = codigos.filter(fueUsado).length;
  const totalSinUsar = codigos.length - totalUsados;
  const codigosFiltrados = codigos.filter((c) =>
    filtro === 'usados' ? fueUsado(c) : filtro === 'sin_usar' ? !fueUsado(c) : true
  );
  const totalPaginas = Math.max(1, Math.ceil(codigosFiltrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const codigosPagina = codigosFiltrados.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="admin-codigos-layout">

      {/* NAVBAR VERDE OFICIAL AÑADIDA */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="codigos-main-wrapper">
        <div className="codigos-container">

          {/* HEADER MODERNO CON BOTÓN DE RETROCESO */}
          <header className="codigos-header">
            <div className="header-titles">
              <h1>Generador de Códigos</h1>
              <p>Gestión y emisión de pines de acceso para admisiones y procesos académicos.</p>
            </div>
            <Link to="/admin/recursos" className="btn-back">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Recursos Internos
            </Link>
          </header>

          {/* SUB-MENÚ DE PESTAÑAS */}
          <div className="codigos-tabs">
            <button className={`codigos-tab ${vista === 'emitir' ? 'active' : ''}`} onClick={() => setVista('emitir')}>
              Emitir Código
            </button>
            <button className={`codigos-tab ${vista === 'seguimiento' ? 'active' : ''}`} onClick={() => setVista('seguimiento')}>
              Seguimiento {!cargandoLista && `(${codigos.length})`}
            </button>
          </div>

          {/* ===================== PESTAÑA: EMITIR ===================== */}
          {vista === 'emitir' && (
          <section className="codigos-card">
            <div className="icon-wrapper-large-gold">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>

            <h2>Emisión de Código</h2>
            <p>
              Registra los datos del aspirante y su encargado. Al generar, se crea un código de un solo uso
              para ingresar al formulario de admisiones, quedando ligado a esta persona.
            </p>

            {/* DATOS DEL ASPIRANTE Y ENCARGADO */}
            <div className="codigo-form">
              <div className="campo">
                <label>Nombre del aspirante</label>
                <input
                  type="text"
                  value={datos.applicantName}
                  onChange={(e) => actualizarDato('applicantName', e.target.value)}
                  placeholder="Nombre completo del aspirante"
                />
              </div>

              <div className="campo">
                <label>Nombre del encargado</label>
                <input
                  type="text"
                  value={datos.guardianName}
                  onChange={(e) => actualizarDato('guardianName', e.target.value)}
                  placeholder="Nombre completo del responsable"
                />
              </div>

              <div className="form-fila-2">
                <div className="campo">
                  <label>Teléfono del encargado</label>
                  <input
                    type="tel"
                    value={datos.guardianPhone}
                    onChange={(e) => actualizarDato('guardianPhone', e.target.value)}
                    placeholder="Ej. 7000-0000"
                  />
                </div>
                <div className="campo">
                  <label>Correo del encargado</label>
                  <input
                    type="email"
                    value={datos.guardianEmail}
                    onChange={(e) => actualizarDato('guardianEmail', e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* AÑO DE MATRÍCULA DEL CÓDIGO (ordinaria o extraordinaria) */}
              <div className="campo">
                <label>¿Para qué año se matriculará el aspirante?</label>
                <select
                  value={anioCodigo}
                  onChange={(e) => setAnioCodigo(parseInt(e.target.value, 10))}
                  style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, color: '#002a4a', background: 'white' }}
                >
                  {aniosDisponibles.map(anio => (
                    <option key={anio} value={anio}>
                      {anio}{anio === new Date().getFullYear() ? ' — ciclo en curso (matrícula extraordinaria)' : ''}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  El año elegido define el ciclo de la admisión, el carnet del alumno (ej: {anioCodigo}1601) y el año lectivo del contrato.
                </p>
              </div>
            </div>

            <button
              className="btn-primary-gold"
              onClick={handleGenerarCodigo}
              disabled={generandoCodigo}
            >
              {generandoCodigo ? 'Generando en Firebase...' : `Generar Código para Matrícula ${anioCodigo}`}
            </button>

            {/* CAJA DE ÉXITO ANIMADA */}
            {codigoGenerado && (
              <div className="success-code-box">
                <span className="success-label">Código generado exitosamente</span>
                <span className="success-code">{codigoGenerado}</span>
                <p className="success-note">Este código ya está activo en Firebase y listo para usarse en el portal de admisiones.</p>
              </div>
            )}
          </section>
          )}

          {/* ===================== PESTAÑA: SEGUIMIENTO ===================== */}
          {vista === 'seguimiento' && (
          <section className="codigos-lista-card">
            <h3>Seguimiento de códigos</h3>
            <p className="codigos-lista-sub">Consulta a quién se le entregó cada código y si ya lo usó. Los "Sin usar" son a quienes puedes llamar para preguntar si tuvieron problemas al registrarse.</p>

            {/* Filtros con contador */}
            {!cargandoLista && codigos.length > 0 && (
              <div className="filtros-codigos">
                <button className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`} onClick={() => setFiltro('todos')}>
                  Todos <span className="filtro-num">{codigos.length}</span>
                </button>
                <button className={`filtro-btn ${filtro === 'sin_usar' ? 'active' : ''}`} onClick={() => setFiltro('sin_usar')}>
                  Sin usar <span className="filtro-num">{totalSinUsar}</span>
                </button>
                <button className={`filtro-btn ${filtro === 'usados' ? 'active' : ''}`} onClick={() => setFiltro('usados')}>
                  Usados <span className="filtro-num">{totalUsados}</span>
                </button>
              </div>
            )}

            {cargandoLista ? (
              <div className="lista-cargando">Cargando códigos...</div>
            ) : codigos.length === 0 ? (
              <div className="lista-vacia">Aún no se ha generado ningún código.</div>
            ) : codigosFiltrados.length === 0 ? (
              <div className="lista-vacia">No hay códigos en esta categoría.</div>
            ) : (
              <>
                <div className="tabla-scroll">
                  <table className="tabla-codigos">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Aspirante</th>
                        <th>Encargado</th>
                        <th>Teléfono</th>
                        <th>Año</th>
                        <th>Estado</th>
                        <th>Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codigosPagina.map((c) => {
                        const estado = estadoDe(c);
                        const usoFecha = c.usedBy && c.usedBy.length > 0 ? c.usedBy[0].usedAt : null;
                        return (
                          <tr key={c.id}>
                            <td className="td-codigo">{c.code}</td>
                            <td>{c.assignedTo?.applicantName || <span className="td-muted">—</span>}</td>
                            <td>
                              {c.assignedTo?.guardianName || <span className="td-muted">—</span>}
                              {c.assignedTo?.guardianEmail && <span className="td-sub">{c.assignedTo.guardianEmail}</span>}
                            </td>
                            <td>
                              {c.assignedTo?.guardianPhone ? (
                                <a className="telefono-link" href={`tel:${c.assignedTo.guardianPhone.replace(/\s/g, '')}`}>
                                  {c.assignedTo.guardianPhone}
                                </a>
                              ) : (
                                <span className="td-muted">—</span>
                              )}
                            </td>
                            <td>{c.year}</td>
                            <td><span className={`estado-badge ${estado.clase}`}>{estado.texto}</span></td>
                            <td>
                              {usoFecha
                                ? formatoFecha(usoFecha)
                                : <span className="td-muted">Pendiente</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINACIÓN */}
                <div className="paginacion">
                  <span className="paginacion-info">
                    Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, codigosFiltrados.length)} de {codigosFiltrados.length}
                  </span>
                  <div className="paginacion-controles">
                    <button
                      className="pag-btn"
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={paginaActual <= 1}
                      aria-label="Anterior"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <span className="pag-actual">{paginaActual} / {totalPaginas}</span>
                    <button
                      className="pag-btn"
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual >= totalPaginas}
                      aria-label="Siguiente"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
          )}

        </div>
      </main>
      {dialogs}
    </div>
  );
}
