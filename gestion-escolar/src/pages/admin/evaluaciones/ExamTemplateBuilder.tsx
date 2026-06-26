import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationService } from '../../../services/evaluationService';
import type { EvaluationQuestion } from '../../../types';

export default function ExamTemplateBuilder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado principal de la plantilla
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([
    { id: 'q_1', question: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  // Lista de grados de tu institución
  const gradosDisponibles = [
    'Kinder 4', 'Kinder 5', 'Preparatoria', 
    '1er Grado', '2do Grado', '3er Grado', 
    '4to Grado', '5to Grado', '6to Grado', 
    '7mo Grado', '8vo Grado', '9no Grado', 
    '1er Año Bachillerato', '2do Año Bachillerato'
  ];

  // ==========================================
  // MANEJO DE PREGUNTAS
  // ==========================================

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: `q_${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: '' }
    ]);
  };

  const removeQuestion = (idToRemove: string) => {
    if (questions.length === 1) return; // Mínimo 1 pregunta
    setQuestions(questions.filter(q => q.id !== idToRemove));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, question: text } : q));
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

    const hayPreguntaVacia = questions.some(q => !q.question.trim() || q.options.some(opt => !opt.trim()) || !q.correctAnswer);
    if (hayPreguntaVacia) {
      setError('Asegúrate de que todas las preguntas tengan texto, 4 opciones y una respuesta correcta seleccionada.');
      return;
    }

    setLoading(true);
    try {
      await evaluationService.createExamTemplate({
        title,
        grade,
        type: 'academic',
        isActive: true,
        questions,
        createdBy: 'admin_id' // Aquí deberías pasar el ID del usuario logueado desde tu AuthContext
      });

      setSuccess('Plantilla de examen guardada exitosamente.');
      
      // Limpiar formulario o redirigir
      setTimeout(() => {
        // navigate('/admin/evaluaciones'); // Descomenta esto para redirigir a la lista
        setTitle('');
        setGrade('');
        setQuestions([{ id: 'q_1', question: '', options: ['', '', '', ''], correctAnswer: '' }]);
        setSuccess('');
      }, 2000);

    } catch (err: any) {
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
        <h1 style={{ color: '#002a4a', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Constructor de Examen</h1>
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
        <h2 style={{ color: '#0f172a', marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>Datos Generales</h2>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', color: '#475569', marginBottom: '0.5rem' }}>Título del Examen</label>
            <input 
              type="text" 
              placeholder="Ej: Examen de Admisión Ciencias y Lenguaje"
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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', color: '#002a4a', fontSize: '1.1rem' }}>Pregunta {index + 1}</label>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
              )}
            </div>

            <input 
              type="text" 
              placeholder="Escribe la pregunta aquí..."
              value={q.question}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem' }}
            />

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