// src/pages/admin/evaluaciones/AdminEvaluacionesList.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { evaluationService } from '../../../services/evaluationService';
import logoImg from '../../../assets/logo.png'; 
import type { AdmissionEvaluation } from '../../../types';
import './AdminEvaluacionesList.css'; // <-- IMPORTAMOS EL CSS

export default function AdminEvaluacionesList() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<(AdmissionEvaluation & { gradeApplying?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dates, setDates] = useState<Record<string, string>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getAllEvaluations();
      setEvaluations(data);

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
          <button onClick={cargarEvaluaciones} className="btn-refresh">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refrescar Lista
          </button>
        </header>

        {error && <div className="alert-box error">{error}</div>}
        {success && <div className="alert-box success">{success}</div>}

        {/* TABLA DE EVALUACIONES */}
        <div className="table-container">
          <table className="evaluaciones-table">
            <thead>
              <tr>
                <th>Aspirante</th>
                <th>Grado</th>
                <th>Tipo de Prueba</th>
                <th>Estado</th>
                <th>Asignar Agenda (Cita)</th>
                <th style={{ textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">No se encontraron registros de evaluaciones en el sistema.</td>
                </tr>
              ) : (
                evaluations.map((e) => (
                  <tr key={e.id}>
                    
                    {/* Información Básica */}
                    <td>
                      <span className="student-name">{e.studentName}</span>
                    </td>
                    <td>
                      <span className="grade-text">{e.gradeApplying || 'No especificado'}</span>
                    </td>
                    <td>
                      <span className={`phase-badge ${e.phaseType === 'academic' ? 'phase-academic' : 'phase-psychological'}`}>
                        {e.phaseName}
                      </span>
                    </td>
                    
                    {/* Estado en el Stepper */}
                    <td>
                      <span className={`status-pill ${e.status}`}>
                        {e.status === 'completed' && '✓ Realizada'}
                        {e.status === 'scheduled' && '📅 Agendada'}
                        {e.status === 'pending' && '⏳ Pendiente'}
                      </span>
                    </td>

                    {/* Inputs de Programación de Fechas */}
                    <td>
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
                        <span className="text-muted">Bloqueado (Prueba finalizada)</span>
                      )}
                    </td>

                    {/* Botón de Acción Especial de Acceso Manual */}
                    <td style={{ textAlign: 'center' }}>
                      {e.phaseType === 'academic' && e.status === 'scheduled' && !e.manualAccessEnabled && (
                        <button onClick={() => handleEnableExam(e.id)} className="btn-enable-exam">
                          Habilitar Examen
                        </button>
                      )}
                      {e.phaseType === 'academic' && e.manualAccessEnabled && e.status !== 'completed' && (
                        <span className="exam-active-badge">
                          Examen Activo en Pantalla
                        </span>
                      )}
                      {e.phaseType === 'psychological' && (
                        <span className="text-muted-bold">Física / Presencial</span>
                      )}
                      {e.status === 'completed' && (
                        <span className="score-badge">Nota: {e.score || 0}</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}