// src/pages/admin/evaluaciones/AdminEvaluacionesList.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { evaluationService } from '../../../services/evaluationService';
import { admissionService } from '../../../services/admissionService';
import logoImg from '../../../assets/logo.png';
import type { Admission, AdmissionEvaluation, EvaluationTemplate } from '../../../types';
import './AdminEvaluacionesList.css'; // <-- IMPORTAMOS EL CSS

export default function AdminEvaluacionesList() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<(AdmissionEvaluation & { gradeApplying?: string })[]>([]);
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [postulantesSinPruebas, setPostulantesSinPruebas] = useState<Admission[]>([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dates, setDates] = useState<Record<string, string>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  // Etiqueta legible de una plantilla: "Matemática — Examen 1er Grado (1er Grado)"
  const etiquetaPlantilla = (t: EvaluationTemplate) =>
    `${t.subject ? `${t.subject} — ` : ''}${t.title} (${t.grade})`;

  // Plantillas ordenadas: primero las del grado del aspirante
  const plantillasParaGrado = (gradeApplying?: string) => {
    const activas = templates.filter(t => t.isActive);
    if (!gradeApplying) return activas;
    const g = gradeApplying.toLowerCase();
    return [...activas].sort((a, b) => {
      const aMatch = g.includes(a.grade.toLowerCase()) || a.grade.toLowerCase().includes(g) ? 0 : 1;
      const bMatch = g.includes(b.grade.toLowerCase()) || b.grade.toLowerCase().includes(g) ? 0 : 1;
      return aMatch - bMatch;
    });
  };

  const handleAssignTemplate = async (evalId: string, templateId: string) => {
    setError('');
    setSuccess('');
    if (!templateId) return;
    try {
      await evaluationService.assignTemplateToEvaluation(evalId, templateId);
      setSuccess('Examen asignado al aspirante correctamente.');
      cargarEvaluaciones();
    } catch {
      setError('No se pudo asignar el examen.');
    }
  };

  // Generar las pruebas (examen académico + psicológico, e inglés si aplica) de un postulante
  const handleGenerarPruebas = async (adm: Admission) => {
    setError('');
    setSuccess('');
    try {
      await evaluationService.createEvaluationsForAdmission(
        adm.id,
        `${adm.studentFirstName} ${adm.studentLastName}`,
        adm.gradeApplying
      );
      setSuccess(`Pruebas generadas para ${adm.studentFirstName} ${adm.studentLastName}. Ya puedes asignarle examen y agendar sus citas.`);
      cargarEvaluaciones();
    } catch {
      setError('No se pudieron generar las pruebas del postulante.');
    }
  };

  // Registrar el resultado de una prueba presencial (psicológica o entrevista).
  // Al completarse todos los exámenes, el aspirante avanza automáticamente a la fase de entrevista.
  const handleRegistrarResultado = async (evaluacion: AdmissionEvaluation) => {
    setError('');
    setSuccess('');

    const observaciones = window.prompt(
      `Registrar resultado de "${evaluacion.phaseName}" de ${evaluacion.studentName}.\n\nObservaciones del evaluador (opcional):`
    );
    if (observaciones === null) return; // canceló

    const satisfactoria = window.confirm(
      'Resultado de la prueba:\n\nAceptar = SATISFACTORIA (aprobada)\nCancelar = REQUIERE SEGUIMIENTO (se revisará en el dictamen)'
    );

    try {
      await evaluationService.completeEvaluation(evaluacion.id, {
        result: satisfactoria ? 'approved' : 'needs-review',
        observations: observaciones.trim() || 'Sin observaciones.',
      });

      const avanzo = await evaluationService.advanceToInterviewIfComplete(evaluacion.admissionId, evaluacion.studentName);
      setSuccess(
        avanzo
          ? 'Resultado registrado. El aspirante completó sus exámenes y pasó a la FASE DE ENTREVISTA (agenda la cita en la fila nueva).'
          : 'Resultado registrado correctamente.'
      );
      cargarEvaluaciones();
    } catch {
      setError('No se pudo registrar el resultado.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      const [data, tpls, admisiones] = await Promise.all([
        evaluationService.getAllEvaluations(),
        evaluationService.getExamTemplates(),
        admissionService.getAllAdmissions(),
      ]);
      setEvaluations(data);
      setTemplates(tpls);

      // Postulantes que YA están en fase de evaluación pero aún no tienen pruebas generadas
      // (no todos los aspirantes se evalúan a la vez: depende de cuándo inicia su proceso)
      const conEvaluaciones = new Set(data.map(e => e.admissionId));
      setPostulantesSinPruebas(
        admisiones.filter(a => a.status === 'evaluations' && !conEvaluaciones.has(a.id))
      );

      const inicializarFechas: Record<string, string> = {};
      const inicializarHoras: Record<string, string> = {};
      const inicializarLugares: Record<string, string> = {};

      data.forEach(e => {
        if (e.scheduledDate) {
          const d = new Date(e.scheduledDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          inicializarFechas[e.id] = `${year}-${month}-${day}`;
        }
        if (e.scheduledTime) inicializarHoras[e.id] = e.scheduledTime;
        if (e.location) inicializarLugares[e.id] = e.location;
      });

      setDates(inicializarFechas);
      setTimes(inicializarHoras);
      setLocations(inicializarLugares);
    } catch (err) {
      setError('Error al cargar la lista de evaluaciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (evalId: string) => {
    setError('');
    setSuccess('');
    
    const fechaSeleccionada = dates[evalId];
    const horaSeleccionada = times[evalId];
    const lugarSeleccionado = locations[evalId] || 'Instalaciones del Colegio';

    if (!fechaSeleccionada || !horaSeleccionada) {
      setError('Por favor selecciona una fecha y hora válida para agendar.');
      return;
    }

    try {
      const dateObj = new Date(fechaSeleccionada + 'T00:00:00');

      await evaluationService.scheduleEvaluation(evalId, {
        scheduledDate: dateObj,
        scheduledTime: horaSeleccionada,
        location: lugarSeleccionado,
        scheduledBy: 'admin_user', 
      });

      setSuccess('Cita agendada con éxito. El aspirante ya puede visualizarla en su portal.');
      cargarEvaluaciones();
    } catch (err) {
      setError('No se pudo guardar la programación.');
    }
  };

  const handleEnableExam = async (evalId: string) => {
    setError('');
    setSuccess('');
    // No se puede habilitar el examen si el aspirante no tiene una plantilla asignada
    const evaluacion = evaluations.find(e => e.id === evalId);
    if (!evaluacion?.templateId) {
      setError('Primero asigna un examen (materia y plantilla) a este aspirante en la columna "Examen Asignado".');
      return;
    }
    try {
      await evaluationService.enableExamManualAccess(evalId, {
        uid: 'admin_user', 
        displayName: 'Administrador'
      });
      setSuccess('¡Examen habilitado! El botón de inicio ya está activo en el portal del aspirante.');
      cargarEvaluaciones();
    } catch (err) {
      setError('Error al habilitar el acceso al examen.');
    }
  };

  // Grados presentes en el sistema (para el filtro)
  const gradosDisponibles = Array.from(new Set([
    ...evaluations.map(e => e.gradeApplying),
    ...postulantesSinPruebas.map(a => a.gradeApplying),
  ].filter((g): g is string => !!g))).sort();

  const evaluacionesFiltradas = filtroGrado ? evaluations.filter(e => e.gradeApplying === filtroGrado) : evaluations;
  const postulantesFiltrados = filtroGrado ? postulantesSinPruebas.filter(a => a.gradeApplying === filtroGrado) : postulantesSinPruebas;

  // Agrupamos por aspirante: una tarjeta por alumno con todas sus pruebas adentro.
  // El inglés no es una prueba aparte: se evalúa como materia dentro del examen académico.
  const ORDEN_PRUEBA: Record<string, number> = { academic: 1, psychological: 2, psychological_interview: 3, interview: 3 };
  const porAspirante = new Map<string, { nombre: string; grado?: string; evaluaciones: (AdmissionEvaluation & { gradeApplying?: string })[] }>();
  for (const e of evaluacionesFiltradas) {
    if (e.phaseType === 'english') continue;
    const grupo = porAspirante.get(e.admissionId) || { nombre: e.studentName, grado: e.gradeApplying, evaluaciones: [] };
    if (!grupo.grado && e.gradeApplying) grupo.grado = e.gradeApplying;
    grupo.evaluaciones.push(e);
    porAspirante.set(e.admissionId, grupo);
  }
  const aspirantes = Array.from(porAspirante.entries()).map(([admissionId, grupo]) => ({
    admissionId,
    ...grupo,
    evaluaciones: [...grupo.evaluaciones].sort((a, b) => (ORDEN_PRUEBA[a.phaseType] || 9) - (ORDEN_PRUEBA[b.phaseType] || 9)),
  }));

  const textoEstado = (status: string) =>
    status === 'completed' ? 'Realizada'
    : status === 'scheduled' ? 'Agendada'
    : status === 'in-progress' ? 'En curso'
    : 'Pendiente';

  if (loading) {
    return (
      <div className="evaluaciones-loading">
        <h2>Cargando Panel de Control...</h2>
      </div>
    );
  }

  return (
    <div className="admin-evaluaciones-layout">
      
      {/* NAVBAR VERDE INSTITUCIONAL */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar Sesión
        </button>
      </nav>
      
      {/* CONTENIDO PRINCIPAL */}
      <main className="evaluaciones-main">
        
        {/* BOTÓN DE RETROCESO */}
        <div className="header-top">
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a Recursos Internos
          </Link>
        </div>

        {/* ENCABEZADO */}
        <header className="evaluaciones-header">
          <div className="header-titles">
            <h1>Control de Evaluaciones Presenciales</h1>
            <p>Programa citas académicas o psicológicas y autoriza el acceso inmediato a los exámenes en línea.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/evaluaciones/constructor')}
              className="btn-refresh"
              style={{ background: '#002a4a' }}
              title={`Plantillas creadas: ${templates.length}`}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear Examen ({templates.length})
            </button>
            <button onClick={cargarEvaluaciones} className="btn-refresh">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refrescar Lista
            </button>
          </div>
        </header>

        {error && <div className="alert-box error">{error}</div>}
        {success && <div className="alert-box success">{success}</div>}

        {/* FILTRO POR GRADO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 0 1.2rem 0', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 'bold', color: '#334155' }}>Filtrar por grado:</label>
          <select
            value={filtroGrado}
            onChange={(e) => setFiltroGrado(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.9rem', minWidth: '200px' }}
          >
            <option value="">Todos los grados</option>
            {gradosDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {filtroGrado && (
            <button onClick={() => setFiltroGrado('')} style={{ padding: '0.4rem 0.8rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              Limpiar filtro
            </button>
          )}
        </div>

        {/* POSTULANTES EN FASE DE EVALUACIÓN SIN PRUEBAS GENERADAS */}
        {postulantesFiltrados.length > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.3rem 0', color: '#854d0e' }}>Postulantes en evaluación sin pruebas generadas ({postulantesFiltrados.length})</h3>
            <p style={{ margin: '0 0 1rem 0', color: '#a16207', fontSize: '0.9rem' }}>
              Estos aspirantes ya están en fase de evaluación pero aún no tienen sus pruebas creadas. Genera sus pruebas para poder asignarles examen y agendar citas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {postulantesFiltrados.map(adm => (
                <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.8rem 1.2rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{adm.studentFirstName} {adm.studentLastName}</strong>
                    <span style={{ color: '#64748b', marginLeft: '0.8rem', fontSize: '0.9rem' }}>{adm.gradeApplying}</span>
                  </div>
                  <button onClick={() => handleGenerarPruebas(adm)} className="btn-enable-exam" style={{ background: '#d97706' }}>
                    Generar Pruebas
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE ASPIRANTES (una tarjeta por alumno con todas sus pruebas) */}
        {aspirantes.length === 0 ? (
          <div className="table-container" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            {filtroGrado
              ? `No hay aspirantes en evaluación para ${filtroGrado}.`
              : 'No se encontraron aspirantes con evaluaciones en el sistema.'}
          </div>
        ) : (
          aspirantes.map(asp => {
            const completadas = asp.evaluaciones.filter(e => e.status === 'completed').length;
            return (
              <div key={asp.admissionId} className="table-container" style={{ marginBottom: '1.2rem', padding: '1.5rem' }}>

                {/* ENCABEZADO DEL ASPIRANTE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.9rem', marginBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
                    <span className="student-name" style={{ fontSize: '1.1rem' }}>{asp.nombre}</span>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                      {asp.grado || 'Grado no especificado'}
                    </span>
                  </div>
                  <span style={{ color: completadas === asp.evaluaciones.length ? '#166534' : '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {completadas} de {asp.evaluaciones.length} pruebas realizadas
                  </span>
                </div>

                {/* PRUEBAS DEL ASPIRANTE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {asp.evaluaciones.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.9rem 1.2rem' }}>

                      {/* Tipo de prueba + estado */}
                      <div style={{ minWidth: '210px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span className={`phase-badge ${e.phaseType === 'academic' ? 'phase-academic' : 'phase-psychological'}`} style={{ width: 'fit-content' }}>
                          {e.phaseName}
                        </span>
                        <span className={`status-pill ${e.status}`} style={{ width: 'fit-content' }}>
                          {textoEstado(e.status)}
                        </span>
                      </div>

                      {/* Examen asignado (solo prueba académica) */}
                      {e.phaseType === 'academic' && (
                        <div style={{ minWidth: '230px' }}>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Examen (materia)</label>
                          {e.status === 'completed' ? (
                            <span className="text-muted">
                              {(() => {
                                const t = templates.find(tp => tp.id === e.templateId);
                                return t ? etiquetaPlantilla(t) : 'Sin registro';
                              })()}
                            </span>
                          ) : (
                            <select
                              className="schedule-input-text"
                              value={e.templateId || ''}
                              onChange={(ev) => handleAssignTemplate(e.id, ev.target.value)}
                              style={{ maxWidth: '230px' }}
                            >
                              <option value="">Elegir materia y examen</option>
                              {plantillasParaGrado(e.gradeApplying).map(t => (
                                <option key={t.id} value={t.id}>{etiquetaPlantilla(t)}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      {/* Agenda de la cita */}
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cita</label>
                        {e.status !== 'completed' ? (
                          <div className="schedule-controls">
                            <input
                              type="date"
                              className="schedule-input"
                              value={dates[e.id] || ''}
                              onChange={(ev) => setDates({ ...dates, [e.id]: ev.target.value })}
                            />
                            <input
                              type="time"
                              className="schedule-input"
                              value={times[e.id] || ''}
                              onChange={(ev) => setTimes({ ...times, [e.id]: ev.target.value })}
                            />
                            <input
                              type="text"
                              className="schedule-input-text"
                              placeholder="Aula / Ubicación"
                              value={locations[e.id] || ''}
                              onChange={(ev) => setLocations({ ...locations, [e.id]: ev.target.value })}
                            />
                            <button onClick={() => handleSchedule(e.id)} className="btn-schedule">
                              Agendar
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">Prueba finalizada</span>
                        )}
                      </div>

                      {/* Acción */}
                      <div style={{ minWidth: '180px', textAlign: 'right' }}>
                        {e.phaseType === 'academic' && e.status === 'scheduled' && !e.manualAccessEnabled && (
                          <button onClick={() => handleEnableExam(e.id)} className="btn-enable-exam">
                            Habilitar Examen
                          </button>
                        )}
                        {e.phaseType === 'academic' && e.manualAccessEnabled && e.status !== 'completed' && (
                          <span className="exam-active-badge">Examen Activo en Pantalla</span>
                        )}
                        {e.phaseType !== 'academic' && (e.status === 'scheduled' || e.status === 'pending') && (
                          <button onClick={() => handleRegistrarResultado(e)} className="btn-enable-exam" style={{ background: '#7c3aed' }}>
                            Registrar Resultado
                          </button>
                        )}
                        {e.status === 'completed' && (
                          e.phaseType === 'academic'
                            ? <span className="score-badge">Nota: {e.score ?? 0}</span>
                            : <span className="score-badge">{e.result === 'approved' ? 'Satisfactoria' : 'Con seguimiento'}</span>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}