// src/pages/admin/evaluaciones/ExamTemplateBuilder.tsx
// Constructor del EXAMEN DE ADMISIÓN (integral): un solo examen por grado,
// compuesto por secciones de materias (ej: 10 preguntas de Ciencias, 10 de
// Matemática). Cada pregunta indica su materia y puede llevar una imagen de
// apoyo (ej: la ecuación fotografiada, para no escribirla a mano).
// La calificación es automática: el sistema saca la nota y el desglose por materia.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cerrarSesionAdmin } from '../../../auth/adminAuth';
import { evaluationService } from '../../../services/evaluationService';
import { compressImage } from '../../../utils/imageCompression';
import logoImg from '../../../assets/logo.png';
import type { EvaluationQuestion } from '../../../types';
import './AdminEvaluacionesList.css'; // Navbar institucional compartida del módulo

const estilos = `
  .etb-page { min-height: 100vh; background: #f1f5f9; font-family: system-ui, sans-serif; padding-bottom: 8rem; }
  .etb-header { max-width: 860px; margin: 2rem auto 0; padding: 0 1.5rem; }
  .etb-back { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.6rem 1.1rem; background: white; color: #002a4a; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: background 0.2s, border-color 0.2s; }
  .etb-back:hover { background: #f8fafc; border-color: #94a3b8; }
  .etb-header h1 { margin: 1.1rem 0 0.4rem; font-size: 1.9rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
  .etb-header p { margin: 0; color: #64748b; font-size: 0.95rem; max-width: 620px; line-height: 1.5; }
  .etb-main { max-width: 860px; margin: 1.6rem auto 0; padding: 0 1.5rem; }
  .etb-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 8px 24px -12px rgba(2, 42, 74, 0.18); padding: 1.8rem; margin-bottom: 1.4rem; }
  .etb-card-title { margin: 0 0 0.3rem; color: #0f172a; font-size: 1.05rem; font-weight: 800; }
  .etb-card-sub { margin: 0 0 1.4rem; color: #64748b; font-size: 0.85rem; line-height: 1.5; }
  .etb-label { display: block; font-weight: 700; color: #475569; margin-bottom: 0.45rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .etb-input, .etb-select { width: 100%; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; background: #fbfdfe; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
  .etb-input:focus, .etb-select:focus { outline: none; border-color: #0068B3; background: white; box-shadow: 0 0 0 4px rgba(0, 104, 179, 0.12); }
  .etb-select { cursor: pointer; }
  .etb-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.32rem 0.9rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
  .etb-chip .dot { width: 8px; height: 8px; border-radius: 50%; }
  .etb-question { background: white; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 14px -8px rgba(2, 42, 74, 0.14); padding: 1.6rem 1.8rem; margin-bottom: 1.2rem; transition: box-shadow 0.2s, transform 0.2s; }
  .etb-question:hover { box-shadow: 0 12px 28px -12px rgba(2, 42, 74, 0.22); }
  .etb-qnum { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0068B3, #008C5A); color: white; font-weight: 800; font-size: 0.95rem; }
  .etb-option-row { display: flex; align-items: center; gap: 0.8rem; padding: 0.65rem 0.9rem; border: 1.5px solid #e2e8f0; border-radius: 10px; background: white; transition: border-color 0.15s, background 0.15s; }
  .etb-option-row:hover { border-color: #93c5fd; }
  .etb-option-row.correcta { border-color: #22c55e; background: #f0fdf4; }
  .etb-option-row input[type="text"] { flex: 1; border: none; background: transparent; font-size: 0.95rem; padding: 0.2rem; }
  .etb-option-row input[type="text"]:focus { outline: none; }
  .etb-img-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1.1rem; background: #f8fafc; border: 1.5px dashed #94a3b8; border-radius: 10px; color: #475569; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; }
  .etb-img-btn:hover { border-color: #0068B3; color: #0068B3; background: #eff6ff; }
  .etb-del-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-weight: 700; font-size: 0.85rem; padding: 0.3rem 0.5rem; border-radius: 8px; transition: color 0.15s, background 0.15s; }
  .etb-del-btn:hover { color: #ef4444; background: #fef2f2; }
  .etb-add { width: 100%; padding: 1.1rem; background: white; color: #0068B3; border: 2px dashed #bcd8ec; border-radius: 16px; font-weight: 800; cursor: pointer; font-size: 0.98rem; display: flex; justify-content: center; align-items: center; gap: 0.5rem; transition: border-color 0.15s, background 0.15s; }
  .etb-add:hover { border-color: #0068B3; background: #f0f7fc; }
  .etb-fab { position: fixed; bottom: 1.6rem; right: 1.6rem; z-index: 60; display: inline-flex; align-items: center; gap: 0.6rem; padding: 1rem 1.7rem; background: #008C5A; color: white; border: none; border-radius: 999px; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 14px 30px -8px rgba(0, 140, 90, 0.55); transition: transform 0.15s, box-shadow 0.15s, background 0.15s; }
  .etb-fab:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 18px 34px -8px rgba(0, 140, 90, 0.6); }
  .etb-fab:disabled { background: #94a3b8; cursor: wait; box-shadow: none; }
  .etb-toast { position: fixed; bottom: 6.4rem; right: 1.6rem; z-index: 60; max-width: 380px; padding: 0.95rem 1.2rem; border-radius: 12px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 12px 30px -10px rgba(15, 23, 42, 0.35); cursor: pointer; line-height: 1.4; }
  .etb-toast.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .etb-toast.success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  @media (max-width: 640px) {
    .etb-header h1 { font-size: 1.5rem; }
    .etb-header { padding: 0 1rem; }
    .etb-main { padding: 0 1rem; }
    .etb-card, .etb-question { padding: 1.2rem; }
    .etb-fab { right: 1rem; bottom: 1rem; padding: 0.9rem 1.3rem; font-size: 0.92rem; }
    .etb-toast { right: 1rem; left: 1rem; max-width: none; bottom: 5.6rem; }
  }
`;

// Colores para el punto de cada materia en el resumen
const COLOR_MATERIA: Record<string, string> = {
  'Matemática': '#0068B3',
  'Lenguaje y Literatura': '#7c3aed',
  'Ciencias Naturales': '#008C5A',
  'Estudios Sociales': '#d97706',
  'Inglés': '#dc2626',
};

export default function ExamTemplateBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado principal de la plantilla
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([
    { id: 'q_1', question: '', subject: '', imageUrl: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  // Lista de grados de tu institución
  const gradosDisponibles = [
    'Kinder 4', 'Kinder 5', 'Preparatoria',
    '1er Grado', '2do Grado', '3er Grado',
    '4to Grado', '5to Grado', '6to Grado',
    '7mo Grado', '8vo Grado', '9no Grado',
    '1er Año Bachillerato', '2do Año Bachillerato'
  ];

  // Materias/asignaturas disponibles para las secciones del examen
  const materiasDisponibles = [
    'Matemática',
    'Lenguaje y Literatura',
    'Ciencias Naturales',
    'Estudios Sociales',
    'Inglés',
  ];

  // Resumen: cuántas preguntas hay por materia (se muestra mientras se construye)
  const resumenMaterias = questions.reduce<Record<string, number>>((acc, q) => {
    const materia = q.subject || 'Sin materia';
    acc[materia] = (acc[materia] || 0) + 1;
    return acc;
  }, {});

  // ==========================================
  // MANEJO DE PREGUNTAS
  // ==========================================

  const addQuestion = () => {
    // La nueva pregunta hereda la materia de la última (agiliza crear bloques de 10)
    const ultimaMateria = questions[questions.length - 1]?.subject || '';
    setQuestions([
      ...questions,
      { id: `q_${Date.now()}`, question: '', subject: ultimaMateria, imageUrl: '', options: ['', '', '', ''], correctAnswer: '' }
    ]);
  };

  const removeQuestion = (idToRemove: string) => {
    if (questions.length === 1) return; // Mínimo 1 pregunta
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const updateQuestion = (id: string, cambios: Partial<EvaluationQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...cambios } : q));
  };

  const updateOption = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = text;

        // Si la opción que se está editando era la respuesta correcta, la actualizamos también
        const newCorrectAnswer = q.correctAnswer === q.options[optionIndex] ? text : q.correctAnswer;

        return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
      }
      return q;
    }));
  };

  const setCorrectAnswer = (questionId: string, answer: string) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, correctAnswer: answer } : q));
  };

  // Subir imagen de apoyo de una pregunta (se comprime antes de subir a Storage)
  const handleImageUpload = async (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImageId(questionId);
    setError('');
    try {
      const compressed = await compressImage(file);
      const url = await evaluationService.uploadExamQuestionImage(compressed);
      updateQuestion(questionId, { imageUrl: url });
    } catch {
      setError('No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setUploadingImageId(null);
      e.target.value = '';
    }
  };

  // ==========================================
  // GUARDAR PLANTILLA
  // ==========================================

  const handleSaveTemplate = async () => {
    setError('');
    setSuccess('');

    // Validaciones básicas
    if (!title.trim() || !grade) {
      setError('Por favor ingresa el título y selecciona el grado.');
      return;
    }

    const preguntaInvalida = questions.some(q =>
      !q.subject ||
      (!q.question.trim() && !q.imageUrl) ||
      q.options.some(opt => !opt.trim()) ||
      !q.correctAnswer
    );
    if (preguntaInvalida) {
      setError('Cada pregunta debe tener materia, enunciado (texto o imagen), 4 opciones y una respuesta correcta seleccionada.');
      return;
    }

    setLoading(true);
    try {
      // Resumen de materias del examen (ej: "Matemática, Ciencias Naturales")
      const materias = Array.from(new Set(questions.map(q => q.subject).filter(Boolean))) as string[];

      await evaluationService.createExamTemplate({
        title,
        grade,
        subject: materias.join(', '),
        type: 'academic',
        isActive: true,
        // Firestore no acepta undefined: la imagen solo se incluye si existe
        questions: questions.map(q => ({
          id: q.id,
          question: q.question.trim(),
          subject: q.subject,
          options: q.options,
          correctAnswer: q.correctAnswer,
          ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
        })),
        createdBy: 'admin_id' // Aquí deberías pasar el ID del usuario logueado desde tu AuthContext
      });

      setSuccess('Examen guardado exitosamente. Ya puedes asignarlo a los aspirantes de este grado.');

      setTimeout(() => {
        setTitle('');
        setGrade('');
        setQuestions([{ id: 'q_1', question: '', subject: '', imageUrl: '', options: ['', '', '', ''], correctAnswer: '' }]);
        setSuccess('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2000);

    } catch {
      setError('Ocurrió un error al guardar la plantilla.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZADO
  // ==========================================

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  return (
    <div className="etb-page">
      <style>{estilos}</style>

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

      {/* ENCABEZADO */}
      <header className="etb-header">
        <button className="etb-back" onClick={() => navigate('/admin/evaluaciones')}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Volver al Control de Evaluaciones
        </button>
        <h1>Constructor de Examen</h1>
        <p>
          Crea el examen integral del grado: agrega secciones por materia (ej: 10 de Ciencias y 10 de Matemática),
          adjunta imágenes para las ecuaciones y deja que el sistema califique automáticamente.
        </p>
      </header>

      <main className="etb-main">

        {/* DATOS GENERALES */}
        <div className="etb-card">
          <h2 className="etb-card-title">Datos Generales</h2>
          <p className="etb-card-sub">El título y el grado identifican el examen al momento de asignarlo a los aspirantes.</p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 300px' }}>
              <label className="etb-label">Título del Examen</label>
              <input
                type="text"
                className="etb-input"
                placeholder="Ej: Examen de Admisión 2026 — 6to Grado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="etb-label">Grado a Aplicar</label>
              <select className="etb-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Seleccione un grado...</option>
                {gradosDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* RESUMEN DE SECCIONES */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.3rem' }}>
            <span style={{ alignSelf: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Secciones:</span>
            {Object.entries(resumenMaterias).map(([materia, cantidad]) => {
              const esInvalida = materia === 'Sin materia';
              return (
                <span
                  key={materia}
                  className="etb-chip"
                  style={{ background: esInvalida ? '#fef2f2' : '#f1f5f9', color: esInvalida ? '#b91c1c' : '#334155', border: `1px solid ${esInvalida ? '#fecaca' : '#e2e8f0'}` }}
                >
                  <span className="dot" style={{ background: esInvalida ? '#ef4444' : (COLOR_MATERIA[materia] || '#64748b') }} />
                  {materia}: {cantidad}
                </span>
              );
            })}
          </div>
        </div>

        {/* PREGUNTAS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.8rem 0 1rem' }}>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Preguntas del Examen</h2>
          <span className="etb-chip" style={{ background: '#e0f2fe', color: '#0369a1' }}>Total: {questions.length}</span>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} className="etb-question">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span className="etb-qnum">{index + 1}</span>
                <span style={{ fontWeight: 800, color: '#002a4a', fontSize: '1rem' }}>Pregunta</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <select
                  className="etb-select"
                  value={q.subject || ''}
                  onChange={(e) => updateQuestion(q.id, { subject: e.target.value })}
                  style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.88rem', borderColor: q.subject ? undefined : '#fca5a5' }}
                >
                  <option value="">Materia...</option>
                  {materiasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {questions.length > 1 && (
                  <button className="etb-del-btn" onClick={() => removeQuestion(q.id)} title="Eliminar pregunta">
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              className="etb-input"
              placeholder="Escribe la pregunta aquí (opcional si subes una imagen)..."
              value={q.question}
              onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
              style={{ marginBottom: '1rem' }}
            />

            {/* IMAGEN DE APOYO (ej: ecuación matemática) */}
            <div style={{ marginBottom: '1.4rem' }}>
              {q.imageUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <img src={q.imageUrl} alt={`Imagen de la pregunta ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <button className="etb-del-btn" onClick={() => updateQuestion(q.id, { imageUrl: '' })}>
                    Quitar imagen
                  </button>
                </div>
              ) : (
                <label className="etb-img-btn" style={{ cursor: uploadingImageId === q.id ? 'wait' : 'pointer' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                  {uploadingImageId === q.id ? 'Subiendo imagen…' : 'Agregar imagen (ej: ecuación)'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingImageId !== null} onChange={(e) => handleImageUpload(q.id, e)} />
                </label>
              )}
            </div>

            <label className="etb-label">Opciones de respuesta — marca la correcta</label>

            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {q.options.map((optionText, optIndex) => {
                const esCorrecta = q.correctAnswer !== '' && q.correctAnswer === optionText;
                return (
                  <div key={optIndex} className={`etb-option-row ${esCorrecta ? 'correcta' : ''}`}>
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={esCorrecta}
                      onChange={() => setCorrectAnswer(q.id, optionText)}
                      disabled={!optionText.trim()}
                      style={{ width: '18px', height: '18px', cursor: optionText.trim() ? 'pointer' : 'not-allowed', accentColor: '#008C5A' }}
                      title="Marcar como respuesta correcta"
                    />
                    <span style={{ fontWeight: 800, color: esCorrecta ? '#16a34a' : '#94a3b8', fontSize: '0.9rem', width: '18px' }}>
                      {['A', 'B', 'C', 'D'][optIndex]}
                    </span>
                    <input
                      type="text"
                      placeholder={`Opción ${['A', 'B', 'C', 'D'][optIndex]}`}
                      value={optionText}
                      onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button className="etb-add" onClick={addQuestion}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Agregar Nueva Pregunta
        </button>
      </main>

      {/* AVISOS FLOTANTES (visibles sin subir la página; clic para cerrar) */}
      {error && <div className="etb-toast error" onClick={() => setError('')} title="Clic para cerrar">{error}</div>}
      {success && <div className="etb-toast success" onClick={() => setSuccess('')} title="Clic para cerrar">{success}</div>}

      {/* BOTÓN GUARDAR ANCLADO ABAJO A LA DERECHA */}
      <button className="etb-fab" onClick={handleSaveTemplate} disabled={loading}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V7.5a.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3.75m9 0H7.5m9 0l3.44 3.44a1.5 1.5 0 01.44 1.06v11a1.5 1.5 0 01-1.5 1.5h-13.5a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5h.001M7.5 20.25v-6a.75.75 0 01.75-.75h7.5a.75.75 0 01.75.75v6" /></svg>
        {loading ? 'Guardando…' : 'Guardar Examen'}
      </button>
    </div>
  );
}
