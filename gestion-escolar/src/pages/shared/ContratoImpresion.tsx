// src/pages/shared/ContratoImpresion.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import './ContratoImpresion.css';

export default function ContratoImpresion() {
  const navigate = useNavigate();
  const [templateText, setTemplateText] = useState('Cargando documento legal...');
  const [loading, setLoading] = useState(true);

  // NOTA: En tu app real, aquí extraerías los datos del alumno desde tu Contexto, 
  // Redux, o consultando a la base de datos (mockStudentDB) usando su carnet.
  // Por ahora, pondremos datos de prueba simulando al alumno activo.
  const studentData = {
    nombre_responsable: 'CARLOS DANIEL GARCÍA LÓPEZ', // Dato sacado de tu captura
    edad_responsable: '45',
    nacionalidad_responsable: 'SALVADOREÑA',
    profesion_responsable: 'EMPLEADO',
    estado_civil_responsable: 'CASADO',
    dui_responsable: '01234567-8',
    domicilio_responsable: 'SANTA ANA, EL SALVADOR',
    nombre_estudiante: 'CARLOS DANIEL GARCÍA LÓPEZ (HIJO)',
    edad_estudiante: '16',
    anio_lectivo: '2026',
    grado_estudiante: 'PREPARATORIA', // Dato sacado de tu captura
    nivel_estudiante: 'PARVULARIA',
    cuota_matricula: '200.00',
    cuota_mensual: '85.00',
    fecha_emision: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'plantilla_contrato'));
        if (docSnap.exists() && docSnap.data().texto_base) {
          setTemplateText(docSnap.data().texto_base);
        } else {
          setTemplateText("Error: El administrador aún no ha configurado la plantilla del contrato en el sistema.");
        }
      } catch (error) {
        console.error("Error al cargar la plantilla", error);
        setTemplateText("Error de conexión al cargar el contrato.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  // Función que inyecta los datos del alumno en la plantilla de Firebase
  const getRenderedContract = () => {
    if (loading) return templateText;
    
    let renderedText = templateText;
    Object.keys(studentData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedText = renderedText.replace(regex, studentData[key as keyof typeof studentData]);
    });
    return renderedText;
  };

  return (
    <div className="impresion-layout">
      
      <div className="impresion-controls">
        <button onClick={() => navigate(-1)} className="btn-back">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver al Panel
        </button>

        <button onClick={() => window.print()} className="btn-print" disabled={loading}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v.64c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-.64z" />
          </svg>
          Imprimir Contrato
        </button>
      </div>

      <div className="a4-sheet">
        {getRenderedContract()}
      </div>

    </div>
  );
}