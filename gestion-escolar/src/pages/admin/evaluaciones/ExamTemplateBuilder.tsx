// src/pages/admin/evaluaciones/ExamTemplateBuilder.tsx
// Constructor del EXAMEN DE ADMISIÓN (integral): un solo examen por grado,
// compuesto por secciones de materias (ej: 10 preguntas de Ciencias, 10 de
// Matemática). Cada pregunta indica su materia y puede llevar una imagen de
// apoyo (ej: la ecuación fotografiada, para no escribirla a mano).
// La calificación es automática: el sistema saca la nota y el desglose por materia.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationService } from '../../../services/evaluationService';
import { compressImage } from '../../../utils/imageCompression';
import type { EvaluationQuestion } from '../../../types';

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

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/evaluaciones')}
            style={{ padding: '0.6rem 1rem', background: 'white', color: '#002a4a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver
          </button>
          <h1 style={{ color: '#002a4a', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Constructor de Examen</h1>
        </div>
        <button
          onClick={handleSaveTemplate}
          disabled={loading}
          style={{ padding: '0.8rem 1.5rem', background: '#008C5A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Guardando...' : 'Guardar Examen'}
        </button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>{error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>{success}</div>}

      {/* DATOS GENERALES */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0f172a', marginTop: 0, marginBottom: '0.5rem', fontSize: '1.2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>Datos Generales</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
          El examen es integral: agrega preguntas de varias materias (ej: 10 de Ciencias y 10 de Matemática) y cada una se marca con su materia. La nota se calcula automáticamente con desglose por materia.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>Título del Examen</label>
            <input
              type="text"
              placeholder="Ej: Examen de Admisión 2026 — 6to Grado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>Grado a Aplicar</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: 'white' }}
            >
              <option value="">Seleccione un grado...</option>
              {gradosDisponibles.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* RESUMEN DE SECCIONES */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
          {Object.entries(resumenMaterias).map(([materia, cantidad]) => (
            <span key={materia} style={{ background: materia === 'Sin materia' ? '#fef2f2' : '#e0f2fe', color: materia === 'Sin materia' ? '#b91c1c' : '#0369a1', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
              {materia}: {cantidad} {cantidad === 1 ? 'pregunta' : 'preguntas'}
            </span>
          ))}
        </div>
      </div>

      {/* PREGUNTAS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.2rem' }}>Preguntas del Examen</h2>
          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Total: {questions.length}
          </span>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderLeft: '5px solid #0068B3' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <label style={{ fontWeight: 'bold', color: '#002a4a', fontSize: '1.1rem' }}>Pregunta {index + 1}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <select
                  value={q.subject || ''}
                  onChange={(e) => updateQuestion(q.id, { subject: e.target.value })}
                  style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', border: q.subject ? '1px solid #cbd5e1' : '2px solid #fca5a5', fontSize: '0.9rem', backgroundColor: 'white' }}
                >
                  <option value="">Materia...</option>
                  {materiasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                )}
              </div>
            </div>

            <input
              type="text"
              placeholder="Escribe la pregunta aquí (opcional si subes una imagen)..."
              value={q.question}
              onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' }}
            />

            {/* IMAGEN DE APOYO (ej: ecuación matemática) */}
            <div style={{ marginBottom: '1.5rem' }}>
              {q.imageUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <img src={q.imageUrl} alt={`Imagen de la pregunta ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <button onClick={() => updateQuestion(q.id, { imageUrl: '' })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', padding: 0 }}>
                    Quitar imagen
                  </button>
                </div>
              ) : (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px', cursor: uploadingImageId === q.id ? 'wait' : 'pointer', color: '#475569', fontSize: '0.88rem', fontWeight: 'bold' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                  {uploadingImageId === q.id ? 'Subiendo imagen…' : 'Agregar imagen (ej: ecuación)'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingImageId !== null} onChange={(e) => handleImageUpload(q.id, e)} />
                </label>
              )}
            </div>

            <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Opciones de Respuesta (Marca la correcta):</label>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {q.options.map((optionText, optIndex) => (
                <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="radio"
                    name={`correct_${q.id}`}
                    checked={q.correctAnswer !== '' && q.correctAnswer === optionText}
                    onChange={() => setCorrectAnswer(q.id, optionText)}
                    disabled={!optionText.trim()}
                    style={{ width: '20px', height: '20px', cursor: optionText.trim() ? 'pointer' : 'not-allowed' }}
                    title="Marcar como respuesta correcta"
                  />
                  <input
                    type="text"
                    placeholder={`Opción ${['A', 'B', 'C', 'D'][optIndex]}`}
                    value={optionText}
                    onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: q.correctAnswer !== '' && q.correctAnswer === optionText ? '2px solid #22c55e' : '1px solid #cbd5e1', backgroundColor: q.correctAnswer !== '' && q.correctAnswer === optionText ? '#f0fdf4' : 'white', fontSize: '1rem' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          style={{ width: '100%', padding: '1rem', background: '#f1f5f9', color: '#002a4a', border: '2px dashed #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Agregar Nueva Pregunta
        </button>
      </div>

    </div>
  );
}
