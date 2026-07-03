// src/pages/shared/ContratoImpresion.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { mockStudentDB } from '../../data/mockStudent';
import './ContratoImpresion.css';

export default function ContratoImpresion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [templateText, setTemplateText] = useState('Cargando documento legal...');
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentData, setStudentData] = useState<any>(null);

  // Función auxiliar para convertir la fecha a letras
  const getFechaLetras = () => {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const numeros = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y un'];
    
    const d = new Date();
    const dia = numeros[d.getDate()] || d.getDate().toString();
    const mes = meses[d.getMonth()];
    
    // Diccionario simple para los años próximos
    const aniosLetras: Record<number, string> = {
      2024: 'dos mil veinticuatro',
      2025: 'dos mil veinticinco',
      2026: 'dos mil veintiséis',
      2027: 'dos mil veintisiete'
    };
    const anio = aniosLetras[d.getFullYear()] || d.getFullYear().toString();

    return `${dia} días del mes de ${mes} del año ${anio}`;
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'plantilla_contrato'));
        if (docSnap.exists() && docSnap.data().texto_base) {
          setTemplateText(docSnap.data().texto_base);
        } else {
          setTemplateText("Error: La plantilla del contrato no ha sido configurada en el sistema.");
        }
      } catch (error) {
        console.error("Error al cargar la plantilla", error);
        setTemplateText("Error de conexión al cargar el contrato.");
      } finally {
        setLoadingTemplate(false);
      }
    };
    fetchTemplate();
  }, []);

  useEffect(() => {
    const source = searchParams.get('source');

    const loadData = async () => {
      if (source === 'nuevo_ingreso') {
        const admissionId = searchParams.get('id');
        if (!admissionId) {
          setTemplateText("Error: No se proporcionó un ID de admisión válido.");
          setLoadingTemplate(false);
          return;
        }

        try {
          const admissionRef = doc(db, 'admissions', admissionId);
          const admissionSnap = await getDoc(admissionRef);

          if (admissionSnap.exists()) {
            const admission = admissionSnap.data() as DocumentData;
            const expediente = admission.expedienteDigital || {};
            
            setStudentData({
              nombre_responsable: expediente.sostenedor_nombre || '________________________',
              nacionalidad_responsable: 'Salvadoreña',
              profesion_responsable: expediente.sostenedor_profesion || '________________________',
              dui_responsable: expediente.sostenedor_dui || '________________________',
              nit_responsable: expediente.sostenedor_nit || '________________________',
              domicilio_responsable: expediente.sostenedor_direccion || '________________________',
              parentesco_responsable: expediente.sostenedor_parentesco || 'PADRE O MADRE',
              edad_responsable: expediente.sostenedor_edad || '__________', 
              estado_civil_responsable: expediente.sostenedor_estado_civil || '_________________', 
              
              nombre_estudiante: `${admission.studentFirstName} ${admission.studentLastName}`.trim(),
              edad_estudiante: expediente.alumno_edad || '_____', 
              grado_estudiante: admission.gradeApplying,
              nivel_estudiante: admission.gradeApplying.includes('Parvularia') || admission.gradeApplying.includes('Kinder') ? 'Parvularia' : 'Educación Básica / Media',
              
              anio_lectivo: admission.enrollmentYear?.toString() || new Date().getFullYear().toString(),
              cuota_matricula: '145.00', // Considerar obtener esto de la configuración de Firebase
              cuota_mensual: '85.00',   // Considerar obtener esto de la configuración de Firebase
              fecha_emision: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
              fecha_emision_letras: getFechaLetras()
            });
          } else {
            setTemplateText(`Error: No se encontró una solicitud de admisión con el ID ${admissionId}.`);
          }
        } catch (error) {
          console.error("Error al cargar datos de admisión:", error);
          setTemplateText("Error de conexión al cargar los datos del estudiante para el contrato.");
        }
      } else {
        // Es un alumno Antiguo (Reingreso)
        const sessionCarnet = localStorage.getItem('studentSession');
        
        if (!sessionCarnet || !mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]) {
          navigate('/reingreso/login'); 
        } else {
          const data = mockStudentDB[sessionCarnet as keyof typeof mockStudentDB];
          setStudentData({
            nombre_responsable: 'PADRE / MADRE / ENCARGADO',
            nacionalidad_responsable: 'Salvadoreña',
            profesion_responsable: '________________________',
            dui_responsable: '________________________',
            nit_responsable: '________________________',
            domicilio_responsable: '________________________',
            parentesco_responsable: '________________________',
            edad_responsable: '_____',
            estado_civil_responsable: '_________________',
            edad_estudiante: '_____',
            nombre_estudiante: `${data.nombres} ${data.apellidos}`,
            grado_estudiante: data.gradoMatricular,
            nivel_estudiante: 'BÁSICA / MEDIA',
            anio_lectivo: '2026',
            cuota_matricula: '145.00',
            cuota_mensual: '85.00',
            fecha_emision: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
            fecha_emision_letras: getFechaLetras()
          });
        }
      }
    };

    loadData();
  }, [navigate, searchParams]);

  // MOTOR BLINDADO DE REEMPLAZO
  const getRenderedContract = () => {
    if (loadingTemplate || !studentData) return 'Generando documento...';
    
    let renderedText = templateText;
    
    // Esta expresión regular busca cualquier cosa entre {{ }}
    // Si la encuentra en studentData, la pone. Si no, pone "____________________"
    renderedText = renderedText.replace(/{{([^}]+)}}/g, (match, key) => {
      const cleanKey = key.trim();
      return studentData[cleanKey] || '____________________'; 
    });

    return renderedText;
  };

  if (!studentData) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Preparando Contrato...</h2>
      </div>
    );
  }

  return (
    <div className="impresion-layout">
      <div className="impresion-controls">
        <button onClick={() => navigate(-1)} className="btn-back">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver al Panel
        </button>

        <button onClick={() => window.print()} className="btn-print" disabled={loadingTemplate}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v.64c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-.64z" />
          </svg>
          Imprimir Contrato
        </button>
      </div>

      <div className="a4-sheet">
        <div dangerouslySetInnerHTML={{ __html: getRenderedContract() }} />
      </div>
    </div>
  );
}