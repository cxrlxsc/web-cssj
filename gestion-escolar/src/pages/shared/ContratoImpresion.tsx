// src/pages/shared/ContratoImpresion.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { mockStudentDB } from '../../data/mockStudent';
import './ContratoImpresion.css';

export default function ContratoImpresion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [templateText, setTemplateText] = useState('Cargando documento legal...');
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  
  // Estado dinámico para guardar los datos del alumno (Nuevos o Antiguos)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentData, setStudentData] = useState<any>(null);

  // 1. Cargar la plantilla de Firebase
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
        setLoadingTemplate(false);
      }
    };
    fetchTemplate();
  }, []);

  // 2. Determinar quién está intentando imprimir (Nuevo Ingreso vs Reingreso)
  useEffect(() => {
    const source = searchParams.get('source');
    const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    if (source === 'nuevo_ingreso') {
      // Es un aspirante de Nuevo Ingreso (Pase VIP por URL)
      const nombreUrl = searchParams.get('nombre') || '';
      const apellidoUrl = searchParams.get('apellido') || '';
      const gradoUrl = searchParams.get('grado') || '';

      setStudentData({
        nombre_responsable: '________________________', // El padre llenará estos datos a mano si no están en la URL
        edad_responsable: '___',
        nacionalidad_responsable: 'SALVADOREÑA',
        profesion_responsable: '________________________',
        estado_civil_responsable: '________________________',
        dui_responsable: '________________________',
        domicilio_responsable: '________________________',
        nombre_estudiante: `${nombreUrl} ${apellidoUrl}`,
        edad_estudiante: '___',
        anio_lectivo: '2026',
        grado_estudiante: gradoUrl,
        nivel_estudiante: 'BÁSICA / MEDIA',
        cuota_matricula: '145.00',
        cuota_mensual: '85.00',
        fecha_emision: todayStr
      });

    } else {
      // Es un alumno Antiguo (Reingreso - Busca en memoria)
      const sessionCarnet = localStorage.getItem('studentSession');
      
      if (!sessionCarnet || !mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]) {
        navigate('/reingreso/login'); // Sin sesión y sin pase VIP = Expulsado
      } else {
        const data = mockStudentDB[sessionCarnet as keyof typeof mockStudentDB];
        setStudentData({
          nombre_responsable: 'PADRE / MADRE / ENCARGADO',
          edad_responsable: '___',
          nacionalidad_responsable: 'SALVADOREÑA',
          profesion_responsable: '________________________',
          estado_civil_responsable: '________________________',
          dui_responsable: '________________________',
          domicilio_responsable: '________________________',
          nombre_estudiante: `${data.nombres} ${data.apellidos}`,
          edad_estudiante: '___',
          anio_lectivo: '2026',
          grado_estudiante: data.gradoMatricular,
          nivel_estudiante: 'BÁSICA / MEDIA',
          cuota_matricula: '145.00',
          cuota_mensual: '85.00',
          fecha_emision: todayStr
        });
      }
    }
  }, [navigate, searchParams]);

  // Función que inyecta los datos del alumno en la plantilla de Firebase
  const getRenderedContract = () => {
    if (loadingTemplate || !studentData) return templateText;
    
    let renderedText = templateText;
    Object.keys(studentData).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedText = renderedText.replace(regex, studentData[key as keyof typeof studentData]);
    });
    return renderedText;
  };

  if (!studentData) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando datos del estudiante...</div>;
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
        {/* Aquí usamos dangerouslySetInnerHTML si en Firebase la plantilla tiene saltos de línea (HTML)
            o simplemente lo mostramos como texto. */}
        <div dangerouslySetInnerHTML={{ __html: getRenderedContract() }} />
      </div>

    </div>
  );
}