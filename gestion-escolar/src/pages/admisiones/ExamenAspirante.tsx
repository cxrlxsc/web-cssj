// src/pages/admisiones/ExamenAspirante.tsx
// Examen académico EN LÍNEA del aspirante (nuevo ingreso).
// Ruta: /portal/examen/:evaluationId  (llega desde el botón "Iniciar Examen en Línea"
// del PortalAspirante, que solo aparece cuando el admin habilitó el acceso).
//
// Flujo: carga la evaluación -> valida acceso -> carga la plantilla asignada
// (con su materia) -> el aspirante responde -> se califica automáticamente y
// la nota queda visible en /admin/evaluaciones.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import type { AdmissionEvaluation, EvaluationTemplate } from '../../types';

type Etapa = 'cargando' | 'bloqueado' | 'inicio' | 'examen' | 'enviado';

const APROBACION_MINIMA = 60; // % para marcar resultado 'approved' automáticamente

// ==========================================
// BARAJADO POR ALUMNO (anti-copia)
// Cada aspirante ve las preguntas y las opciones en un orden distinto
// (la semilla es el ID de su evaluación), pero el orden es ESTABLE:
// si recarga la página, ve exactamente el mismo examen.
// ==========================================
function semillaDesdeTexto(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function barajar<T>(items: T[], semillaTexto: string): T[] {
  let seed = semillaDesdeTexto(semillaTexto);
  const rand = () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const ExamenAspirante = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState<Etapa>('cargando');
  const [mensajeBloqueo, setMensajeBloqueo] = useState('');
  const [evaluacion, setEvaluacion] = useState<AdmissionEvaluation | null>(null);
  const [plantilla, setPlantilla] = useState<EvaluationTemplate | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [notaFinal, setNotaFinal] = useState<{
    correctas: number;
    total: number;
    porcentaje: number;
    detalle: { materia: string; correctas: number; total: number }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (!evaluationId) {
        setMensajeBloqueo('Enlace de examen no válido.');
        setEtapa('bloqueado');
        return;
      }
      try {
        const ev = await evaluationService.getEvaluation(evaluationId);
        if (!ev) {
          setMensajeBloqueo('No se encontró la evaluación. Verifica el enlace desde tu portal.');
          setEtapa('bloqueado');
          return;
        }
        setEvaluacion(ev);

        if (ev.status === 'completed') {
          setMensajeBloqueo('Este examen ya fue realizado. Tu nota está registrada en el sistema.');
          setEtapa('bloqueado');
          return;
        }
        if (!ev.manualAccessEnabled) {
          setMensajeBloqueo('El examen aún no ha sido habilitado por el encargado. Espera la indicación en el aula.');
          setEtapa('bloqueado');
          return;
        }
        if (!ev.templateId) {
          setMensajeBloqueo('Aún no tienes un examen asignado. Avisa al encargado de la evaluación.');
          setEtapa('bloqueado');
          return;
        }

        const tpl = await evaluationService.getExamTemplate(ev.templateId);
        if (!tpl || !tpl.questions?.length) {
          setMensajeBloqueo('El examen asignado no está disponible. Avisa al encargado de la evaluación.');
          setEtapa('bloqueado');
          return;
        }
        setPlantilla(tpl);
        // Si ya lo había empezado, retomamos sus respuestas guardadas
        if (ev.answers) setRespuestas(ev.answers);
        setEtapa(ev.examStartedAt ? 'examen' : 'inicio');
      } catch {
        setMensajeBloqueo('Error de conexión al cargar el examen. Intenta de nuevo.');
        setEtapa('bloqueado');
      }
    })();
  }, [evaluationId]);

  const handleComenzar = async () => {
    if (!evaluacion) return;
    try {
      await evaluationService.updateEvaluation(evaluacion.id, {
        examStartedAt: new Date(),
        status: 'in-progress',
      });
    } catch {
      // Si falla el marcado de inicio no bloqueamos el examen
    }
    setEtapa('examen');
  };

  const handleResponder = (preguntaId: string, opcion: string) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcion }));
  };

  // El examen es integral: se agrupa en SECCIONES por materia (Ciencias, Matemática...).
  // Dentro de cada sección, las preguntas y sus opciones se barajan por alumno.
  const secciones = useMemo(() => {
    if (!plantilla || !evaluacion) return [];
    const orden: string[] = [];
    const porMateria = new Map<string, typeof plantilla.questions>();
    for (const q of plantilla.questions) {
      const materia = q.subject || 'General';
      if (!porMateria.has(materia)) {
        porMateria.set(materia, []);
        orden.push(materia);
      }
      porMateria.get(materia)!.push(q);
    }
    return orden.map(materia => ({
      materia,
      preguntas: barajar(porMateria.get(materia)!, `${evaluacion.id}_${materia}`).map(q => ({
        ...q,
        options: barajar(q.options, `${evaluacion.id}_${q.id}`),
      })),
    }));
  }, [plantilla, evaluacion]);

  const respondidas = plantilla ? plantilla.questions.filter(q => respuestas[q.id]).length : 0;
  const total = plantilla?.questions.length || 0;

  const handleEnviar = async () => {
    if (!evaluacion || !plantilla) return;
    if (respondidas < total) {
      const seguir = window.confirm(`Te faltan ${total - respondidas} preguntas por responder. ¿Deseas enviar el examen de todas formas?`);
      if (!seguir) return;
    }

    setEnviando(true);
    try {
      // Calificación automática global y por materia (así no hay revisión manual)
      const correctas = plantilla.questions.filter(q => respuestas[q.id] === q.correctAnswer).length;
      const porcentaje = Math.round((correctas / total) * 100);

      const porMateria: Record<string, { correctas: number; total: number }> = {};
      for (const q of plantilla.questions) {
        const materia = q.subject || 'General';
        if (!porMateria[materia]) porMateria[materia] = { correctas: 0, total: 0 };
        porMateria[materia].total++;
        if (respuestas[q.id] === q.correctAnswer) porMateria[materia].correctas++;
      }
      const detalle = Object.entries(porMateria).map(([materia, r]) => ({ materia, ...r }));
      const detalleTexto = detalle.map(d => `${d.materia}: ${d.correctas}/${d.total}`).join(' | ');

      await evaluationService.saveExamAnswers(evaluacion.id, respuestas);
      await evaluationService.updateEvaluation(evaluacion.id, { examCompletedAt: new Date() });
      await evaluationService.completeEvaluation(evaluacion.id, {
        score: porcentaje,
        maxScore: 100,
        result: porcentaje >= APROBACION_MINIMA ? 'approved' : 'needs-review',
        observations: `Calificación automática: ${correctas} de ${total} correctas (${porcentaje}%). Detalle por materia: ${detalleTexto}. Examen: ${plantilla.title}.`,
      });

      // Si con esto se completaron todos los exámenes, el aspirante pasa a la fase de entrevista
      try {
        await evaluationService.advanceToInterviewIfComplete(evaluacion.admissionId, evaluacion.studentName);
      } catch {
        // El avance de fase lo puede disparar también el admin al registrar la otra prueba
      }

      setNotaFinal({ correctas, total, porcentaje, detalle });
      setEtapa('enviado');
    } catch {
      alert('No se pudo enviar el examen. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================
  const cardStyle = { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };

  if (etapa === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '4rem', fontFamily: 'system-ui, sans-serif' }}>Cargando examen...</div>;
  }

  if (etapa === 'bloqueado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
        <div style={{ ...cardStyle, maxWidth: '450px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '50%', padding: '1.2rem', color: '#64748b' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
          </div>
          <h2 style={{ color: '#002a4a', marginTop: 0 }}>Examen no disponible</h2>
          <p style={{ color: '#64748b' }}>{mensajeBloqueo}</p>
          <button onClick={() => navigate('/mi-solicitud')} style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Volver a mi Portal
          </button>
        </div>
      </div>
    );
  }

  if (etapa === 'enviado' && notaFinal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
        <div style={{ ...cardStyle, maxWidth: '480px', textAlign: 'center', borderTop: '6px solid #008C5A' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#dcfce7', borderRadius: '50%', padding: '1.2rem', color: '#16a34a' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h2 style={{ color: '#008C5A', marginTop: 0 }}>Examen enviado con éxito</h2>
          <p style={{ color: '#334155', fontSize: '1.05rem' }}>
            Respondiste correctamente <strong>{notaFinal.correctas} de {notaFinal.total}</strong> preguntas.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.5rem', margin: '1.5rem 0' }}>
            <span style={{ display: 'block', fontSize: '0.85rem', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Tu calificación</span>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#008C5A' }}>{notaFinal.porcentaje}%</span>
            {notaFinal.detalle.length > 1 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left' }}>
                {notaFinal.detalle.map(d => (
                  <div key={d.materia} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#166534', borderTop: '1px dashed #bbf7d0', paddingTop: '0.4rem' }}>
                    <span>{d.materia}</span>
                    <strong>{d.correctas} / {d.total}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>El colegio revisará tus resultados y continuará con el proceso de admisión. Puedes seguir tu avance desde tu portal.</p>
          <button onClick={() => navigate('/mi-solicitud')} style={{ marginTop: '0.5rem', padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Volver a mi Portal
          </button>
        </div>
      </div>
    );
  }

  if (etapa === 'inicio' && plantilla) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
        <div style={{ ...cardStyle, maxWidth: '520px', borderTop: '6px solid #0068B3' }}>
          <h1 style={{ color: '#002a4a', marginTop: 0, fontSize: '1.5rem' }}>{plantilla.title}</h1>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {plantilla.subject && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Materias: {plantilla.subject}</span>}
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Grado: {plantilla.grade}</span>
            <span style={{ background: '#fef3c7', color: '#854d0e', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>{total} preguntas</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
            <strong style={{ color: '#002a4a' }}>Indicaciones:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
              <li>Lee con calma cada pregunta y marca una sola respuesta.</li>
              <li>Puedes cambiar tus respuestas antes de enviar.</li>
              <li>Al presionar "Enviar Examen" tu nota se calculará automáticamente.</li>
            </ul>
          </div>
          <p style={{ color: '#334155' }}>Aspirante: <strong>{evaluacion?.studentName}</strong></p>
          <button onClick={handleComenzar} style={{ width: '100%', padding: '1rem', background: '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}>
            Comenzar Examen
          </button>
        </div>
      </div>
    );
  }

  // etapa === 'examen'
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', paddingBottom: '5rem' }}>
      {/* BARRA SUPERIOR FIJA CON PROGRESO */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#002a4a', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <strong>{plantilla?.title}</strong>
          {plantilla?.subject && <span style={{ opacity: 0.8 }}> · {plantilla.subject}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem' }}>Respondidas: <strong>{respondidas} / {total}</strong></span>
          <div style={{ width: '140px', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${total ? (respondidas / total) * 100 : 0}%`, height: '100%', background: '#FAB529', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '2rem auto', padding: '0 1rem' }}>
        {(() => {
          let numero = 0;
          return secciones.map(seccion => (
            <div key={seccion.materia}>
              {/* ENCABEZADO DE SECCIÓN (MATERIA) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1.8rem 0 1rem 0' }}>
                <h2 style={{ margin: 0, color: '#002a4a', fontSize: '1.15rem' }}>{seccion.materia}</h2>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                  {seccion.preguntas.length} {seccion.preguntas.length === 1 ? 'pregunta' : 'preguntas'}
                </span>
                <div style={{ flex: 1, height: '2px', background: '#e2e8f0' }} />
              </div>

              {seccion.preguntas.map(q => {
                numero += 1;
                return (
                  <div key={q.id} style={{ ...cardStyle, marginBottom: '1.2rem', borderLeft: respuestas[q.id] ? '5px solid #008C5A' : '5px solid #cbd5e1' }}>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#0f172a', fontSize: '1.05rem' }}>
                      {numero}. {q.question}
                    </p>
                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt={`Imagen de la pregunta ${numero}`}
                        style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'block' }}
                      />
                    )}
                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                      {q.options.map((opcion, i) => (
                        <label
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
                            border: respuestas[q.id] === opcion ? '2px solid #0068B3' : '1px solid #e2e8f0',
                            background: respuestas[q.id] === opcion ? '#eff6ff' : 'white',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#334155',
                          }}
                        >
                          <input
                            type="radio"
                            name={`pregunta_${q.id}`}
                            checked={respuestas[q.id] === opcion}
                            onChange={() => handleResponder(q.id, opcion)}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span><strong style={{ color: '#0068B3' }}>{['A', 'B', 'C', 'D'][i]}.</strong> {opcion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}

        <button
          onClick={handleEnviar}
          disabled={enviando}
          style={{ width: '100%', padding: '1.1rem', background: enviando ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: enviando ? 'wait' : 'pointer', marginTop: '0.5rem' }}
        >
          {enviando ? 'Enviando…' : `Enviar Examen (${respondidas}/${total} respondidas)`}
        </button>
      </div>
    </div>
  );
};

export default ExamenAspirante;
