// src/components/admisiones/PoliticaPrivacidadContenido.tsx
// Texto único de la Política de Privacidad y Tratamiento de Datos del proceso de
// admisión. Se usa tanto en el paso de aceptación (portal de aspirantes) como en
// la página pública /politica-privacidad, para que siempre coincidan.
//
// IMPORTANTE: si cambias el texto de forma sustancial, sube la versión
// (POLITICA_VERSION) para que quede registrado qué versión aceptó cada familia.

export const POLITICA_VERSION = '2026-v1';

export function PoliticaPrivacidadContenido() {
  const h: React.CSSProperties = { color: '#002a4a', fontSize: '1.05rem', fontWeight: 800, margin: '1.4rem 0 0.5rem' };
  const p: React.CSSProperties = { color: '#334155', fontSize: '0.95rem', lineHeight: 1.65, margin: '0 0 0.6rem' };
  const li: React.CSSProperties = { color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '0.35rem' };

  return (
    <div>
      <p style={{ ...p, color: '#64748b', fontSize: '0.85rem' }}>
        Versión {POLITICA_VERSION} · Colegio Salesiano San José, Santa Ana, El Salvador
      </p>

      <p style={p}>
        El Colegio Salesiano San José (en adelante, "el Colegio") solicita y trata datos personales del
        aspirante y de su grupo familiar con el único fin de gestionar el proceso de admisión y matrícula.
        Al aceptar esta política, usted, en su calidad de padre, madre o representante legal, autoriza dicho
        tratamiento conforme a la <strong>Ley Crecer Juntos para la Protección Integral de la Primera Infancia,
        Niñez y Adolescencia</strong> y demás normativa aplicable.
      </p>

      <h3 style={h}>1. Datos que recolectamos</h3>
      <ul style={{ margin: 0, paddingLeft: '1.3rem' }}>
        <li style={li}>Datos del aspirante: nombres, fecha de nacimiento, sexo, NIE, grado y colegio de procedencia.</li>
        <li style={li}>Datos sensibles de salud: tipo de sangre, enfermedades y alergias (para atención y emergencias).</li>
        <li style={li}>Datos de contacto y familiares: nombres, teléfonos, correos y dirección de padres/encargados.</li>
        <li style={li}>Datos del sostenedor económico para facturación (DUI, NIT).</li>
        <li style={li}>Documentos de respaldo: partida de nacimiento, notas, foto, DUI del responsable, entre otros.</li>
        <li style={li}>Resultados de las evaluaciones de admisión (académica y psicológica).</li>
      </ul>

      <h3 style={h}>2. Finalidad del tratamiento</h3>
      <p style={p}>
        Los datos se utilizan exclusivamente para: evaluar la solicitud de ingreso, programar y calificar las
        evaluaciones, elaborar el expediente académico, generar credenciales y contratos, y comunicar a la
        familia el avance del proceso. No se usan con fines comerciales ni publicitarios.
      </p>

      <h3 style={h}>3. Datos sensibles y de menores de edad</h3>
      <p style={p}>
        Reconociendo que se trata de información de niñas, niños y adolescentes, el Colegio adopta medidas
        reforzadas de confidencialidad. Los datos de salud se emplean únicamente para el cuidado del estudiante
        y su atención en caso de emergencia.
      </p>

      <h3 style={h}>4. Confidencialidad y almacenamiento</h3>
      <p style={p}>
        La información se almacena en servidores seguros (plataforma en la nube con controles de acceso) y solo
        es consultada por el personal autorizado del Colegio (Registro Académico, Colecturía, Psicología y
        Dirección). Los documentos se conservan cifrados en tránsito y no se comparten con terceros salvo
        obligación legal o autoridad competente.
      </p>

      <h3 style={h}>5. Conservación</h3>
      <p style={p}>
        Los datos se conservan durante el tiempo que dure el proceso de admisión y, de concretarse la matrícula,
        mientras el estudiante permanezca en la institución y por los plazos que exija la normativa educativa.
        Si la solicitud no prospera, los datos se conservan por un periodo razonable para fines estadísticos y
        de auditoría, y luego se eliminan o anonimizan.
      </p>

      <h3 style={h}>6. Derechos de la familia</h3>
      <p style={p}>
        Usted puede solicitar en cualquier momento el acceso, la rectificación o la eliminación de los datos
        proporcionados, así como retirar este consentimiento, escribiendo o presentándose en el departamento de
        Registro Académico del Colegio. El retiro del consentimiento puede impedir la continuación del proceso
        de admisión.
      </p>

      <h3 style={h}>7. Contacto</h3>
      <p style={p}>
        Para ejercer sus derechos o resolver dudas sobre esta política, comuníquese con el departamento de
        Registro Académico del Colegio Salesiano San José, Santa Ana, El Salvador.
      </p>

      <p style={{ ...p, marginTop: '1.2rem', fontWeight: 700, color: '#002a4a' }}>
        Al marcar la casilla de aceptación, usted declara que ha leído y comprende esta política, y que otorga su
        consentimiento libre e informado para el tratamiento de los datos personales aquí descritos.
      </p>
    </div>
  );
}

export default PoliticaPrivacidadContenido;
