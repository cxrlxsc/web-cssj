// src/pages/admisiones/ExamenAspirante.tsx
// Examen académico EN LÍNEA del aspirante (nuevo ingreso).
// Ruta: /portal/examen/:evaluationId  (llega desde el botón "Iniciar Examen en Línea"
// del PortalAspirante, que solo aparece cuando el admin habilitó el acceso).
//
// Flujo: carga la evaluación -> valida acceso -> carga la plantilla asignada
// (con su materia) -> el aspirante responde pregunta por pregunta (con panel
// lateral para saltar entre ellas) -> se califica automáticamente y la nota
// queda visible en /admin/evaluaciones (el aspirante NO ve su calificación).
//
// LÍMITE DE TIEMPO: 2 horas desde que presiona "Comenzar Examen". El límite
// sobrevive recargas (se calcula desde examStartedAt guardado en Firestore).
// Al agotarse, el examen se envía automáticamente con lo respondido.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import type { AdmissionEvaluation, EvaluationTemplate } from '../../types';

type Etapa = 'cargando' | 'bloqueado' | 'inicio' | 'examen' | 'enviado';

const APROBACION_MINIMA = 60; // % para marcar resultado 'approved' automáticamente
const DURACION_EXAMEN_MS = 2 * 60 * 60 * 1000; // 2 horas
const AVISO_TIEMPO_MS = 10 * 60 * 1000; // últimos 10 min: cronómetro en rojo

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

function formatoTiempo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(seg).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
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
  const [tiempoAgotado, setTiempoAgotado] = useState(false);
  const [indiceActual, setIndiceActual] = useState(0);
  const [restanteMs, setRestanteMs] = useState<number | null>(null);

  // Refs para que el cronómetro (setInterval) siempre vea el estado vigente
  // y para evitar un doble envío (clic manual + disparo automático).
  const respuestasRef = useRef<Record<string, string>>({});
  const enviandoRef = useRef(false);
  const autoEnviadoRef = useRef(false);

  useEffect(() => {
    respuestasRef.current = respuestas;
  }, [respuestas]);

  // Califica y envía el examen. porTiempo=true cuando lo dispara el límite de 2 horas.
  const calificarYEnviar = async (
    ev: AdmissionEvaluation,
    tpl: EvaluationTemplate,
    resp: Record<string, string>,
    porTiempo = false
  ) => {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      // Calificación automática global y por materia (así no hay revisión manual)
      const totalPreguntas = tpl.questions.length;
      const correctas = tpl.questions.filter(q => resp[q.id] === q.correctAnswer).length;
      const porcentaje = totalPreguntas ? Math.round((correctas / totalPreguntas) * 100) : 0;

      const porMateria: Record<string, { correctas: number; total: number }> = {};
      for (const q of tpl.questions) {
        const materia = q.subject || 'General';
        if (!porMateria[materia]) porMateria[materia] = { correctas: 0, total: 0 };
        porMateria[materia].total++;
        if (resp[q.id] === q.correctAnswer) porMateria[materia].correctas++;
      }
      const detalleTexto = Object.entries(porMateria)
        .map(([materia, r]) => `${materia}: ${r.correctas}/${r.total}`)
        .join(' | ');

      await evaluationService.saveExamAnswers(ev.id, resp);
      await evaluationService.updateEvaluation(ev.id, { examCompletedAt: new Date() });
      await evaluationService.completeEvaluation(ev.id, {
        score: porcentaje,
        maxScore: 100,
        result: porcentaje >= APROBACION_MINIMA ? 'approved' : 'needs-review',
        observations: `Calificación automática: ${correctas} de ${totalPreguntas} correctas (${porcentaje}%). Detalle por materia: ${detalleTexto}. Examen: ${tpl.title}.${porTiempo ? ' Enviado automáticamente al agotarse el tiempo límite de 2 horas.' : ''}`,
      });

      // Si con esto se completaron todos los exámenes, el aspirante pasa a la fase de entrevista
      try {
        await evaluationService.advanceToInterviewIfComplete(ev.admissionId, ev.studentName);
      } catch {
        // El avance de fase lo puede disparar también el admin al registrar la otra prueba
      }

      setTiempoAgotado(porTiempo);
      setEtapa('enviado');
    } catch {
      if (porTiempo) {
        setMensajeBloqueo('Se agotó el tiempo del examen, pero hubo un error al enviarlo. Avisa al encargado de la evaluación.');
        setEtapa('bloqueado');
      } else {
        alert('No se pudo enviar el examen. Verifica tu conexión e intenta de nuevo.');
      }
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

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

        // ¿Se agotó el tiempo mientras estaba fuera? Se envía automáticamente
        // con las respuestas que alcanzó a guardar.
        if (ev.examStartedAt) {
          const transcurrido = Date.now() - new Date(ev.examStartedAt as unknown as string | Date).getTime();
          if (transcurrido >= DURACION_EXAMEN_MS) {
            autoEnviadoRef.current = true;
            await calificarYEnviar(ev, tpl, ev.answers || {}, true);
            return;
          }
        }

        setEtapa(ev.examStartedAt ? 'examen' : 'inicio');
      } catch {
        setMensajeBloqueo('Error de conexión al cargar el examen. Intenta de nuevo.');
        setEtapa('bloqueado');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId]);

  // CRONÓMETRO: cuenta regresiva desde examStartedAt + 2 horas. Al llegar a 0,
  // envía el examen automáticamente con lo respondido hasta ese momento.
  useEffect(() => {
    if (etapa !== 'examen' || !evaluacion?.examStartedAt || !plantilla) return;
    const limite = new Date(evaluacion.examStartedAt as unknown as string | Date).getTime() + DURACION_EXAMEN_MS;

    const tick = () => {
      const restante = limite - Date.now();
      setRestanteMs(Math.max(0, restante));
      if (restante <= 0 && !autoEnviadoRef.current) {
        autoEnviadoRef.current = true;
        calificarYEnviar(evaluacion, plantilla, respuestasRef.current, true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, evaluacion, plantilla]);

  const handleComenzar = async () => {
    if (!evaluacion) return;
    const ahora = new Date();
    try {
      await evaluationService.updateEvaluation(evaluacion.id, {
        examStartedAt: ahora,
        status: 'in-progress',
      });
    } catch {
      // Si falla el marcado de inicio no bloqueamos el examen
    }
    // El cronómetro local arranca con la misma hora que quedó guardada
    setEvaluacion(prev => (prev ? { ...prev, examStartedAt: ahora, status: 'in-progress' } : prev));
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

  // Lista plana en el orden que ve el alumno (para navegar pregunta por pregunta)
  const preguntasPlanas = useMemo(
    () => secciones.flatMap(s => s.preguntas.map(q => ({ ...q, materia: s.materia }))),
    [secciones]
  );

  const respondidas = plantilla ? plantilla.questions.filter(q => respuestas[q.id]).length : 0;
  const total = plantilla?.questions.length || 0;

  // Cambia de pregunta y aprovecha para guardar el avance en Firestore
  // (así, si se agota el tiempo o se va la luz, lo respondido no se pierde).
  const irAPregunta = (i: number) => {
    const destino = Math.max(0, Math.min(preguntasPlanas.length - 1, i));
    setIndiceActual(destino);
    if (evaluacion) {
      evaluationService.saveExamAnswers(evaluacion.id, respuestasRef.current).catch(() => {});
    }
  };

  const handleEnviar = async () => {
    if (!evaluacion || !plantilla) return;
    if (respondidas < total) {
      const seguir = window.confirm(`Te faltan ${total - respondidas} preguntas por responder. ¿Deseas enviar el examen de todas formas?`);
      if (!seguir) return;
    }
    await calificarYEnviar(evaluacion, plantilla, respuestas, false);
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

  if (etapa === 'enviado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1rem' }}>
        <div style={{ ...cardStyle, maxWidth: '480px', textAlign: 'center', borderTop: '6px solid #008C5A' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ background: '#dcfce7', borderRadius: '50%', padding: '1.2rem', color: '#16a34a' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <h2 style={{ color: '#008C5A', marginTop: 0 }}>{tiempoAgotado ? 'Tiempo finalizado' : 'Examen enviado con éxito'}</h2>
          <p style={{ color: '#334155', fontSize: '1.05rem' }}>
            {tiempoAgotado
              ? 'Se agotó el tiempo límite de 2 horas y tu examen se envió automáticamente con las respuestas que marcaste.'
              : 'Ya realizaste esta prueba. Tus respuestas quedaron registradas.'}
          </p>
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
            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Duración: 2 horas</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
            <strong style={{ color: '#002a4a' }}>Indicaciones:</strong>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
              <li>Tienes un máximo de <strong>2 horas</strong>: el tiempo corre desde que presionas "Comenzar Examen".</li>
              <li>Al agotarse el tiempo, el examen se envía automáticamente con lo que hayas respondido.</li>
              <li>Responde una pregunta a la vez; puedes regresar y cambiar tus respuestas antes de enviar.</li>
              <li>Usa el panel de números para saltar a cualquier pregunta.</li>
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
  const preguntaActual = preguntasPlanas[indiceActual];
  const esUltima = indiceActual === preguntasPlanas.length - 1;
  const tiempoCritico = restanteMs !== null && restanteMs <= AVISO_TIEMPO_MS;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', paddingBottom: '5rem' }}>
      {/* BARRA SUPERIOR FIJA CON CRONÓMETRO Y PROGRESO */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#002a4a', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <strong>{plantilla?.title}</strong>
          {plantilla?.subject && <span style={{ opacity: 0.8 }}> · {plantilla.subject}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {restanteMs !== null && (
            <span
              title="Tiempo restante"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '1.05rem',
                fontVariantNumeric: 'tabular-nums', padding: '0.35rem 0.9rem', borderRadius: '20px',
                background: tiempoCritico ? '#dc2626' : 'rgba(255,255,255,0.15)',
                border: tiempoCritico ? '1px solid #fecaca' : '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {formatoTiempo(restanteMs)}
            </span>
          )}
          <span style={{ fontSize: '0.9rem' }}>Respondidas: <strong>{respondidas} / {total}</strong></span>
          <div style={{ width: '140px', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${total ? (respondidas / total) * 100 : 0}%`, height: '100%', background: '#FAB529', transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1050px', margin: '2rem auto', padding: '0 1rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* PREGUNTA ACTUAL (una a la vez) */}
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          {preguntaActual && (
            <div style={{ ...cardStyle, borderLeft: respuestas[preguntaActual.id] ? '5px solid #008C5A' : '5px solid #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {preguntaActual.materia}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Pregunta {indiceActual + 1} de {preguntasPlanas.length}
                </span>
              </div>

              <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>
                {indiceActual + 1}. {preguntaActual.question}
              </p>
              {preguntaActual.imageUrl && (
                <img
                  src={preguntaActual.imageUrl}
                  alt={`Imagen de la pregunta ${indiceActual + 1}`}
                  style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', display: 'block' }}
                />
              )}
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {preguntaActual.options.map((opcion, i) => (
                  <label
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
                      border: respuestas[preguntaActual.id] === opcion ? '2px solid #0068B3' : '1px solid #e2e8f0',
                      background: respuestas[preguntaActual.id] === opcion ? '#eff6ff' : 'white',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#334155',
                    }}
                  >
                    <input
                      type="radio"
                      name={`pregunta_${preguntaActual.id}`}
                      checked={respuestas[preguntaActual.id] === opcion}
                      onChange={() => handleResponder(preguntaActual.id, opcion)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span><strong style={{ color: '#0068B3' }}>{['A', 'B', 'C', 'D'][i]}.</strong> {opcion}</span>
                  </label>
                ))}
              </div>

              {/* NAVEGACIÓN ANTERIOR / SIGUIENTE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => irAPregunta(indiceActual - 1)}
                  disabled={indiceActual === 0}
                  style={{
                    padding: '0.8rem 1.4rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem',
                    border: '1px solid #cbd5e1', background: 'white', color: indiceActual === 0 ? '#cbd5e1' : '#334155',
                    cursor: indiceActual === 0 ? 'default' : 'pointer',
                  }}
                >
                  ← Anterior
                </button>
                {esUltima ? (
                  <button
                    onClick={handleEnviar}
                    disabled={enviando}
                    style={{ padding: '0.8rem 1.6rem', background: enviando ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: enviando ? 'wait' : 'pointer' }}
                  >
                    {enviando ? 'Enviando…' : 'Enviar Examen'}
                  </button>
                ) : (
                  <button
                    onClick={() => irAPregunta(indiceActual + 1)}
                    style={{ padding: '0.8rem 1.6rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PANEL LATERAL: NAVEGADOR DE PREGUNTAS */}
        <aside style={{ flex: '0 1 250px', minWidth: '210px', position: 'sticky', top: '86px' }}>
          <div style={{ ...cardStyle, padding: '1.2rem' }}>
            <h3 style={{ margin: '0 0 0.8rem 0', color: '#002a4a', fontSize: '1rem' }}>Preguntas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: '6px' }}>
              {preguntasPlanas.map((q, i) => {
                const contestada = !!respuestas[q.id];
                const esActual = i === indiceActual;
                return (
                  <button
                    key={q.id}
                    onClick={() => irAPregunta(i)}
                    title={`Pregunta ${i + 1} — ${q.materia}${contestada ? ' (respondida)' : ''}`}
                    style={{
                      padding: '0.45rem 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                      background: contestada ? '#008C5A' : 'white',
                      color: contestada ? 'white' : '#64748b',
                      border: esActual ? '2px solid #0068B3' : contestada ? '1px solid #008C5A' : '1px solid #cbd5e1',
                      outline: esActual ? '2px solid #bfdbfe' : 'none',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.9rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#008C5A', display: 'inline-block' }} /> Respondida
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'white', border: '1px solid #cbd5e1', display: 'inline-block' }} /> Pendiente
              </span>
            </div>
            <button
              onClick={handleEnviar}
              disabled={enviando}
              style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', background: enviando ? '#94a3b8' : '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: enviando ? 'wait' : 'pointer' }}
            >
              {enviando ? 'Enviando…' : `Enviar Examen (${respondidas}/${total})`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamenAspirante;
