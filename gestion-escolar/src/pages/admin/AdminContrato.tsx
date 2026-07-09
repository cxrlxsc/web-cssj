// src/pages/admin/AdminContrato.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { configService } from '../../services/configService';
import logoImg from '../../assets/logo.png';
import { cerrarSesionAdmin } from '../../auth/adminAuth';
import './adminStyles/AdminContrato.css';

// ============================================================================
// PLANTILLA COMPLETA DEL CONTRATO (Extraída del PDF Oficial)
// ============================================================================
const DEFAULT_TEMPLATE = `CONTRATO POR SERVICIOS EDUCATIVOS
COLEGIO SALESIANO "SAN JOSÉ"

NOSOTROS: {{director_nombre}}, de {{director_edad}} años de edad, {{director_condicion}}, del domicilio de {{director_domicilio}}, {{director_nacionalidad}}, con {{director_documento}}, actuando en mi calidad de {{director_cargo}} en representación del presbítero {{representante_nombre}} en su calidad de {{representante_cargo}}, la cual es propietaria del COLEGIO SALESIANO SAN JOSÉ, con domicilio en Final Diecisiete Avenida Sur, Calle Salesiano San José, Barrio El Angel, Cantón Loma Alta, de la Ciudad de Santa Ana, Departamento de Santa Ana, de conformidad con el código de infraestructura N°. 20058, y que en lo sucesivo se denominará como EL CENTRO EDUCATIVO, y el/la Representante Legal {{nombre_responsable}} de {{edad_responsable}} años de edad, de nacionalidad {{nacionalidad_responsable}}, {{profesion_responsable}}, {{estado_civil_responsable}}, con DUI No. {{dui_responsable}} y domicilio en {{domicilio_responsable}}, con pleno ejercicio de los derechos inherentes a la Autoridad Parental y al Cuidado Personal, en su condición de PADRE y Representante Legal de: {{nombre_estudiante}}, de {{edad_estudiante}} años de edad, estudiante del Colegio Salesiano San José, quiénes en lo sucesivo serán conocidos como EL/LA RESPONSABLE y cuya información personal proporcionada en este contrato será de carácter confidencial, de forma voluntaria y sin mediar ningún tipo de coacción o amenaza, con base al Art. 9 inciso 2 y 47 inciso final, de la Ley Crecer Juntos para la Protección Integral de la Primera Infancia, Niñez y Adolescencia, reconociendo el rol fundamental de la familia como medio natural para garantizar la protección integral de las niñas, niños y adolescentes y su papel primario y preponderante en su Desarrollo; como padre, madre o responsable, haciendo uso del derecho preferente a escoger la educación de las niñas, niños y adolescentes, hemos convenido en celebrar el presente CONTRATO POR SERVICIOS EDUCATIVOS, lo anterior de conformidad con las siguientes cláusulas:

PRIMERA: Que el señor {{director_nombre}}, manifiesta en el acto que, el Colegio Salesiano San José se encuentra debidamente autorizado por el Ministerio de Educación, de conformidad con las disposiciones contenidas en el Acuerdo Ministerial No. 15-0963 de dicho Ministerio, de fecha veintisiete de junio del año dos mil ocho, la cual en el acto es puesta a la vista de los comparecientes y se enteran de su contenido, naturaleza jurídica y alcances.

SEGUNDA: Ambas, las partes, son advertidas que el presente contrato se rige por la Constitución de la República de El Salvador; el Respeto a los Derechos Fundamentales y la Dignidad de la Persona; así como por la Ley General de Educación, la Ley Crecer Juntos y para la Protección Integral de la Primera Infancia, Niñez y Adolescencia y en especial por los Reglamentos de EL CENTRO EDUCATIVO. Acuerdan las partes celebrar el presente contrato cuyo objeto es la prestación de servicios educativos que corresponden al Programa Nacional del Ministerio de Educación, prestados por EL CENTRO EDUCATIVO, servicios de los cuales EL/LA RESPONSABLE solicita, reconoce y acepta y manifiesta en el acto su conformidad.

TERCERA: EL/LA RESPONSABLE es el/la representante legal ante EL CENTRO EDUCATIVO, de: {{nombre_estudiante}}, en adelante denominado como EL/LA ALUMNO/A, quien cursará durante la totalidad del año lectivo {{anio_lectivo}}, el {{grado_estudiante}} del nivel de {{nivel_estudiante}}.

CUARTA: EL CENTRO EDUCATIVO se compromete a ofrecer servicios educativos y formativos según la identidad de Centro Educativo Religioso Católico Privado que promueve la enseñanza y la práctica de la Religión Católica, como fundamento esencial para la formación y educación de la persona. EL/LA RESPONSABLE, al elegir a EL CENTRO EDUCATIVO, reconoce y acepta que está inscribiendo a EL/LA ALUMNO/A en una propuesta educativa católica. Consecuentemente, acepta en pleno ejercicio de la autoridad parental y el cuidado personal que su hijo/a participe en todas las actividades de esta propuesta, como parte integral del curriculum, del calendario escolar o que se planifiquen de forma extraordinaria, por EL CENTRO EDUCATIVO. EL/LA RESPONSABLE declara, en este acto, conocer la oferta de EL CENTRO EDUCATIVO, sus planes de estudio, reglamentos y demás normativa interna y acepta someterse a ellas en su condición propia y en representación de EL/LA ALUMNO/A, al reconocer que son parte integral de la presente relación contractual y admite el papel fundamental para la educación de EL/LA ALUMNO. Asimismo, en este acto, EL/LA RESPONSABLE se compromete a acatar las disposiciones y resoluciones académico administrativas emitidas por el DIRECTOR GENERAL de EL CENTRO EDUCATIVO, generadas como respuesta a situaciones emergentes debidamente justificadas inherentes al desarrollo del año escolar.

QUINTA: Manifiesta el señor {{director_nombre}} que EL CENTRO EDUCATIVO velará por la protección, la vida, la salud y la seguridad del alumnado en general, por lo tanto, no avala actividades dentro o fuera del horario regular, que atenten contra la moral, el orden público, las buenas costumbres o la interrupción incorrecta del funcionamiento ordinario de EL CENTRO EDUCATIVO. También EL CENTRO EDUCATIVO no fomentará ni permitirá de ningún modo el fumar, el consumo de licor o cualquier uso de drogas, estupefacientes ilegales, el abuso de drogas o estupefacientes presentes en medicamentos, ni la promoción, constitución o pertenencia a asociaciones ilícitas (pandillas juveniles, maras, o similares) dentro y fuera de EL CENTRO EDUCATIVO. EL/LA RESPONSABLE, está obligado/a a velar por la correcta conducta de EL/LA ALUMNO/A bajo los lineamientos de la moral y el buen comportamiento, así como ejercer la debida supervisión para que EL/LA ALUMNO/A cumpla y respete las facultades del CENTRO EDUCATIVO contenidas en esta cláusula, particularmente para que no consuma drogas (ilegales o abuse de las legales) o la ingesta de cualquier tipo de bebida alcohólica. Asimismo, EL/LA RESPONSABLE velará por que EL/LA ALUMNO/A no promueva, constituya, forme parte o pertenezca a asociaciones ilicitas (pandillas juveniles, maras, o similares) que atenten contra su proceso educativo y su dignidad como persona.

SEXTA: EL CENTRO EDUCATIVO cumplirá y respetará el derecho de EL/LA RESPONSABLE a la información veraz, clara, suficiente y oportuna respecto del proceso educativo de EL/LA ALUMNO/A. EL CENTRO EDUCATIVO facilitará a EL/LA RESPONSABLE el acceso a las instalaciones e información que solicite en relación con EL/LA ALUMNO/A, todo conforme a las regulaciones dictadas al efecto y con previa cita. EL CENTRO EDUCATIVO permitirá el ingreso de EL/LA RESPONSABLE a las oficinas administrativas y salas de atención al público, en los horarios definidos previa cita, con el compromiso de mantener una conducta respetuosa dentro de las instalaciones, con el fin de solicitar y obtener información periódica respecto del rendimiento, evaluación, reuniones y llamados de EL CENTRO EDUCATIVO, de cualquier otro asunto de interés para ambas partes, en relación a la educación de EL/LA ALUMNO/A. Para garantizar el derecho de EL/LA ALUMNO/A a la seguridad, no se permite el ingreso a las áreas académicas y formativas de EL CENTRO EDUCATIVO sin previa cita y en horario lectivo. EL/LA RESPONSABLE, se compromete a asistir a las reuniones y actividades a las que es convocado por EL CENTRO EDUCATIVO para unificar esfuerzos en aras de la formación y educación de EL/LA ALUMNO/A, análisis de su proceso educativo y la resolución de conflictos, si fuera necesario, pues es obligación de EL/LA RESPONSABLE incentivar, exigir y verificar la asistencia regular a clases y apoyar en todo el proceso educativo, así como atender el llamado de EL CENTRO EDUCATIVO (Evaluación, Convivencia y Disciplina), los cuales han sido debidamente publicados y socializados. EL/LA RESPONSABLE acepta que estos reglamentos protegen los derechos fundamentales de EL/LA ALUMNO/A, y se compromete a su cumplimiento y el de su representado.

SÉPTIMA: CLÁUSULA DE PLATAFORMA EDUCATIVA. EL CENTRO EDUCATIVO para el desarrollo de sus actividades escolares, posee una plataforma educativa virtual, a través de la cual se mantiene en comunicación con EL/LA ALUMNO/A. Por lo tanto, EL/LA RESPONSABLE se compromete a monitorear de manera periódica esta plataforma con la finalidad de acompañar y apoyar el proceso educativo de EL/LA ALUMNO/A y estar informado de las actividades que EL CENTRO EDUCATIVO requiere de su representado. Asimismo, EL CENTRO EDUCATIVO posee correos electrónicos institucionales para la comunicación oficial, por lo tanto, EL/LA RESPONSABLE velará por la utilización adecuada de dichos canales de comunicación. Otras formas de comunicación virtual entre el CENTRO EDUCATIVO, EL/LA RESPONSABLE y EL/LA ALUMNO/A no se considerarán como medio oficial.

OCTAVA: EL/LA RESPONSABLE tiene derecho a la libertad de elección del servicio. Al elegir libremente los servicios de EL CENTRO EDUCATIVO, EL/LA RESPONSABLE acepta en el acto y asume la propuesta curricular y formativa. EL CENTRO EDUCATIVO se compromete a cumplir con dicha propuesta. Para alcanzar debidamente los objetivos de la propuesta curricular y formativa de EL CENTRO EDUCATIVO, se hace necesaria la libre contratación de servicios extracurriculares por parte de EL/LA RESPONSABLE, a saber: selecciones deportivas, servicios tecnológicos, servicio de piscina fuera de horario, Banda Musical Festiva y de Paz, idiomas extranjeros adicionales, servicios de capellanía y acompañamiento espiritual y servicios de información en línea. La contratación de estos servicios se hará bajo la solicitud libre de EL/LA RESPONSABLE.

NOVENA: EL/LA RESPONSABLE tiene derecho a la libertad de elección de bienes. EL/LA RESPONSABLE acepta el listado de libros de texto, útiles y materiales escolares, y uniformes requeridos por EL CENTRO EDUCATIVO, indispensable para el logro de los objetivos de la propuesta curricular y formativa de EL/LA ALUMNO/A, y se obliga a proveer lo contenido en dicho listado. EL/LA RESPONSABLE podrá adquirir los libros de texto, útiles escolares y uniformes de EL/LA ALUMNO/A en el establecimiento de su conveniencia. Todos los libros de texto requeridos por la propuesta curricular y formativa deben cumplir con las estipulaciones vigentes del Derecho Internacional e Interno de Derechos de Autor, Propiedad Intelectual y Derechos Conexos. EL CENTRO EDUCATIVO no permitirá, bajo ningún motivo, el uso de fotocopias ilícitas y material que incumpla con las disposiciones legales vigentes. EL CENTRO EDUCATIVO pone a disposición de EL/LA RESPONSABLE el servicio de venta de libros de texto, útiles y uniformes, el cual cumplirá con todas las obligaciones tributarias de ley en materia impositiva.

DÉCIMA: EL/LA RESPONSABLE tiene derecho a la libre contratación de bienes y servicios necesarios para la educación de EL/LA ALUMNO/A, por lo tanto, podrá contratar el servicio de transporte y seguro escolar adicional al que proporciona EL CENTRO EDUCATIVO que sea de su necesidad y conveniencia. En el caso de accidente y de no contar con la cobertura de seguro y no pudiendo localizar a EL/LA RESPONSABLE, éste expresamente autoriza a EL CENTRO EDUCATIVO a solicitar los servicios públicos que el Estado ofrece para la atención de emergencias por accidentes o enfermedad de EL/LA ALUMNO/A.

DÉCIMA PRIMERA: EL CENTRO EDUCATIVO atiende a EL/LA RESPONSABLE a través de los siguientes servicios: Operadora Telefónica (PBX 2486-0800), correo electrónico de atención (recepcion@salesianosanjose.edu.sv), horarios de citas, Asistente de Dirección, Asistente de Administración, Registro académico.

DÉCIMA SEGUNDA: EL/LA RESPONSABLE tendrá derecho a terminar unilateralmente el presente contrato en un plazo no mayor de cinco días hábiles contados a partir de la firma del mismo, siempre que no hubiera hecho uso del bien o servicio. Si ejercita oportunamente este derecho, le serán restituidos, en su totalidad, los valores pagados. En caso de que EL/LA RESPONSABLE desee terminar el presente contrato vencido el plazo de cinco días establecido, deberá pagar los Gastos Administrativos en los que incurrió EL CENTRO EDUCATIVO, equivalentes al veinticinco por ciento de la suma de la inscripción. Si hubiese utilizado los servicios de EL CENTRO EDUCATIVO, deberá pagar el costo de los mismos hasta el mes corriente.

DÉCIMA TERCERA: EL/LA RESPONSABLE se compromete a efectuar los siguientes pagos, sin necesidad de cobro ni requerimiento alguno:
a) Inscripción/Matrícula (Un solo pago anual)............................$ {{cuota_matricula}}
b) Colegiatura Mensual (12 Cuotas en los meses de Enero a Diciembre).....$ {{cuota_mensual}}
(Con un recargo de $5.00 por mora)

La inscripción y las cuotas antes referidas, son las autorizadas por el Ministerio de Educación a través de la Dirección Nacional de Educación departamento de Acreditación Institucional de dicho ministerio. Para el pago de la inscripción/matricula y las colegiaturas, ambas partes acuerdan: a) El valor de la inscripción será pagado a la firma del presente contrato; b) Las colegiaturas de los meses de enero a diciembre del año {{anio_lectivo}}, se pagarán cada mes; c) El pago de los servicios extracurriculares se hará junto con las cuotas de los meses de enero a noviembre, bajo la solicitud libre de EL/LA RESPONSABLE; d) EL/LA RESPONSABLE reconoce y acuerda con EL CENTRO EDUCATIVO, realizar de forma anticipada los pagos por concepto de colegiaturas de enero a diciembre del ciclo lectivo {{anio_lectivo}}, debiendo verificar el pago a más tardar el día diez de cada mes por los medios que EL CENTRO EDUCATIVO designe para tal fin y para lo cual se le proporcionará a EL/LA RESPONSABLE la boleta y el recibo correspondientes. (*Pagos a través de: Pago en ventanilla en los siguientes Bancos: Davivienda, Banco de América Cental, Banco Azul, Link de pago y pagos en colecturía del colegio)

DÉCIMA CUARTA: EL/LA RESPONSABLE reconoce y acepta que está obligado a reparar económicamente los daños materiales directos e indirectos, junto con los perjuicios causados por EL/LA ALUMNO/A a las instalaciones, mobiliario, equipo y demás bienes muebles propiedad de EL CENTRO EDUCATIVO. El monto será calculado y comunicado a EL/LA RESPONSABLE por parte de la Administración, y se adicionará el cobro a la cuota del mes corriente, siempre y cuando sean debidamente comprobados y atribuidos al mismo. Igualmente, EL/LA RESPONSABLE reconoce y acepta que se hará cargo por los daños materiales directos e indirectos, junto con los perjuicios causados por EL/LA ALUMNO/A de forma dolosa o culposa a funcionarios, estudiantes, padres de familia o visitantes de EL CENTRO EDUCATIVO siempre y cuando sean debidamente comprobados y atribuidos al mismo.

DÉCIMA QUINTA: Este contrato se dará por terminado de forma unilateral si al 31 de diciembre del año {{anio_lectivo}}, EL/LA RESPONSABLE se encuentra moroso en el pago de colegiaturas mensuales, o si EL/LA ALUMNO/A adeuda materiales, libros, equipos u otros que le hayan sido dados en préstamo y que sean propiedad de EL CENTRO EDUCATIVO, casos en los cuales EL/LA RESPONSABLE reconoce y acepta que queda en obligación de cancelar los adeudos por los servicios y bienes recibidos.

DÉCIMA SEXTA: Una vez firmado este contrato y cancelado el monto económico correspondiente a la inscripción, se dará por establecida en firme la inscripción de EL/LA ALUMNO/A en EL CENTRO EDUCATIVO por parte de EL/LA RESPONSABLE.

DÉCIMA SÉPTIMA: EL CENTRO EDUCATIVO puede solicitar a EL/LA RESPONSABLE la realización de exámenes de laboratorio clínico o de similar naturaleza que determinen el uso de drogas o estupefacientes o sustancias ilicitas por parte de EL/LA ALUMNO/A, para efectos de apoyo y rehabilitación, si así se requiriera. No existirá responsabilidad económica de EL CENTRO EDUCATIVO por el hecho de solicitar la realización de este tipo de exámenes, independientemente de si el resultado es positivo o negativo.

DÉCIMA OCTAVA: Con el fin de velar por la seguridad e integridad física de la Comunidad Educativa y de las instalaciones, EL CENTRO EDUCATIVO tiene implementadas medidas de seguridad que son de obligatorio cumplimiento. En caso de que EL/LA RESPONSABLE no procure la salida de EL/LA ALUMNO/A o no lo retire de las instalaciones de EL CENTRO EDUCATIVO a la hora de finalización de jornada escolar diaria, EL/LA RESPONSABLE acepta que al no cumplir con esta responsabilidad, EL CENTRO EDUCATIVO puede tomar las medidas educativas y administrativas que considere pertinentes, con la finalidad de resguardar la integridad y el bienestar de EL/LA ALUMNO/A. La apertura de portones en horario matutino será a las 6:00 a.m. debiendo permanecer el padre de familia acompañando a su hijo hasta las 6:20 a.m. que se aperturan los portones internos con acompañamiento docente previamente delegado por las coordinaciones de convivencia, la hora límite de ingreso será 6:45 a.m.

DÉCIMA NOVENA: EL/LA RESPONSABLE autoriza a EL CENTRO EDUCATIVO la filmación, fotografiado, grabación y documentación escrita de entrevistas, llamadas telefónicas y convivencia ordinaria, realizadas dentro de las instalaciones o actividades programadas del mismo, para garantizar la calidad del servicio y la seguridad personal de los miembros de la Comunidad Educativa de EL CENTRO EDUCATIVO sin que esto perjudique el honor y la imagen de los niños, niñas y adolescentes y con la garantia de reserva, sin perjuicio que EL/LA RESPONSABLE pueda tener acceso a ella, de conformidad con el Art. 77 de la Ley Crecer Juntos para la Protección Integral de la Primera Infancia, Niñez y Adolescencia.

VIGÉSIMA: EL CENTRO EDUCATIVO no presta servicios médicos. Por lo tanto, EL/LA RESPONSABLE es el obligado a velar por la buena salud de EL/LA ALUMNO/A; a su vez debe informar a EL CENTRO EDUCATIVO acerca del historial clínico del mismo, compartiendo las observaciones, recomendaciones y prescripciones pertinentes. EL/LA RESPONSABLE autoriza a EL CENTRO EDUCATIVO para que se le suministren los primeros auxilios a EL/LA ALUMNO/A en caso de necesidad y acepta, en este acto, el proceso de atención y aplicación de los mismos. EL CENTRO EDUCATIVO podrá requerir a EL/LA RESPONSABLE el retiro temporal de EL/LA ALUMNO si su estado de salud lo amerita. EL RESPONSABLE debe atender este requerimiento de manera inmediata para la atención médica de EL/LA ALUMNO/A. EL CENTRO EDUCATIVO, de conformidad a la Cláusula Décima, en casos de accidentes, goza de una póliza de Seguro Colectivo de Accidentes Personales, a favor de EL/LA ALUMNO/A, la cual es obligatoria y forma parte de los costos asumidos por EL/LA RESPONSABLE en la matrícula escolar.

VIGÉSIMA PRIMERA: En la eventualidad de una disputa legal relacionada con el cuidado personal o representación legal de EL/LA ALUMNO/A (TUTOR O CURADOR), EL CENTRO EDUCATIVO, se reserva el derecho de solicitar a EL/LA RESPONSABLE que demuestre con documento legal idóneo, quién se encuentra legitimado en su ejercicio, a fin de velar por la seguridad e integridad fisica, moral y espiritual de EL/LA ALUMNO/A, tanto para que se tenga una certeza juridica sobre la persona indicada para reclamar derechos, ejercicio de deberes, retirar a EL/LA ALUMNO/A de EL CENTRO EDUCATIVO o bien para brindar información del proceso educativo del mismo.

VIGÉSIMA SEGUNDA: EL/LA RESPONSABLE se compromete a mantener informado a EL CENTRO EDUCATIVO de sus números de teléfono domiciliares, móviles y laborales, dirección de correo electrónico, así como de notificar cualquier cambio de dirección de domicilio o electrónica, con la finalidad de poder informarle inmediatamente en caso de accidente, o cualquier eventualidad que requiera de su presencia o conocimiento. Igualmente, en sus escritos, reclamaciones, recursos, cartas, solicitudes escritas u oficios, EL/LA RESPONSABLE estará obligado a señalar medio de comunicación o dirección para atender notificaciones de EL CENTRO EDUCATIVO.

VIGÉSIMA TERCERA: DEL PLAZO DE VIGENCIA. El servicio educativo convenido mediante este Contrato de Prestación de Servicios Educativos tendrá vigencia para el ciclo escolar del año {{anio_lectivo}}. El Colegio se reserva el derecho de renovar la vigencia de este contrato por un año más. En caso de ausencia prolongada de EL/LA ALUMNO/A durante el ciclo escolar, EL/LA RESPONSABLE, garantizará que EL/LA ALUMNO/A se actualice debidamente con sus obligaciones educativas durante la vigencia del presente contrato. En caso de que EL/LA ALUMNO/A sea retirado de manera unilateral por EL/LA RESPONSABLE en el transcurso del ciclo escolar, éste deberá informar por escrito al CENTRO EDUCATIVO y al momento de hacerlo deberá estar solvente de sus obligaciones. EL CENTRO EDUCATIVO no hará devoluciones de ningún tipo en estos casos.

VIGÉSIMA CUARTA: Este contrato se dará por terminado unilateralmente si EL/LA ALUMNO/A o EL/LA RESPONSABLE manifiestan rechazo de forma escrita, verbal o de hecho, a la propuesta educativa de EL CENTRO EDUCATIVO, así como actitudes de indiferencia, apatía y descuido reiterado por parte de EL/LA ALUMNO/A en el cumplimiento de sus obligaciones educativas, disciplinarias, de asistencia y puntualidad, y otras inherentes a su condición de estudiante, las cuales hayan sido debidamente informadas a EL/LA RESPONSABLE.

VIGÉSIMA QUINTA: Será motivo para no renovar este contrato, alguna de las siguientes causales: i) Que EL/LA ALUMNO/A no cumpla con los requisitos de aprobación del reglamento de evaluación vigente del Ministerio de Educación de El Salvador. ii) Que EL/LA ALUMNO/A no alcance la nota mínima de siete puntos en más de cuatro sub-áreas (curriculares o extracurriculares) incluyendo la nota de conducta. iii) Que EL/LA ALUMNO/A, según el Reglamento de Convivencia y Disciplina de EL CENTRO EDUCATIVO, no obtenga como mínimo siete puntos en la nota de conducta. iv) Que EL/LA ALUMNO/A no supere el condicionamiento de matricula del ciclo escolar recién finalizado. v) Que el claustro de docentes de EL/LA ALUMNO/A en sesión consensuada recomiende el cambio de ambiente educativo. vi) Que EL/LA RESPONSABLE no cumpla con las obligaciones especificadas en este contrato. vii) Que EL/LA ALUMNO/A no cumpla con las disposiciones de alguno de los Reglamentos Internos de EL CENTRO EDUCATIVO, referidos estos a Evaluación, Convivencia y Disciplina.

VIGÉSIMA SEXTA: Los comparecientes manifestamos que hemos leído íntegramente el presente contrato y conscientes de su contenido, objeto, validez y demás efectos legales, lo aceptamos, ratificamos y firmamos, y cuya legalización de firmas correrá por cuenta de EL CENTRO EDUCATIVO. Se hace entrega de una copia del presente contrato al Padre/Madre de Familia o RESPONSABLE.

En la ciudad de Santa Ana, a los {{fecha_emision_letras}}.

F. _________________________________
{{director_nombre}}
{{director_cargo}}

F. _________________________________
EL/LA RESPONSABLE: {{nombre_responsable}}

DOY FE. Que las firmas que calzan en el anterior documento corresponden a {{director_nombre}}, de {{director_edad}} años de edad, {{director_condicion}}, del domicilio de {{director_domicilio}}... y por el/la Sr(a). {{nombre_responsable}}, de {{edad_responsable}} años de edad, profesión {{profesion_responsable}}, domicilio {{domicilio_responsable}}, portadora de su Documento Único de Identidad y Número de Identificación Tributaria debidamente homologado {{dui_responsable}}.`;

// Datos institucionales editables (Director / Representante Legal). Se inyectan en la
// plantilla como {{director_...}} y {{representante_...}}. Cambian si cambia el director.
const DEFAULT_INSTITUCIONAL = {
  director_nombre: 'GUILLERMO CÉSAR ARGÜELLO ALVARADO',
  director_edad: '54',
  director_condicion: 'sacerdote católico',
  director_nacionalidad: 'nicaragüense',
  director_domicilio: 'la ciudad de Santa Ana',
  director_cargo: 'Director General',
  director_documento: 'Carnet de extranjero residente número un millón trece mil ciento sesenta y dos, extendido el veintidós de octubre de dos mil veinticuatro, con vencimiento el veintisiete de octubre de dos mil veintiocho',
  representante_nombre: 'ARNOLDO DE JESÚS CUBÍAS RIVAS',
  representante_cargo: 'PRESIDENTE Y REPRESENTANTE LEGAL DE LA ASOCIACIÓN INSTITUCIÓN SALESIANA',
};

type DatosInstitucionales = typeof DEFAULT_INSTITUCIONAL;

export default function AdminContrato() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'preview' | 'editor'>('preview');

  // Estado para la plantilla en crudo (desde Firebase)
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE);
  const [datosInstitucionales, setDatosInstitucionales] = useState<DatosInstitucionales>(DEFAULT_INSTITUCIONAL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado ampliado con todos los datos que requiere el contrato PDF
  const [studentData, setStudentData] = useState({
    nombre_responsable: 'MILTON GEOVANNI ERAZO ACOSTA',
    edad_responsable: '40',
    nacionalidad_responsable: 'SALVADOREÑA',
    profesion_responsable: 'TEC. EN ING DE SISTEMAS Y REDES INFORMÁTICAS',
    estado_civil_responsable: 'CASADO',
    dui_responsable: '03494312-5',
    domicilio_responsable: 'COL. SANTA ROSA 1, LOS PLANES, LAGO DE COATEPEQUE, SANTA ANA',
    nombre_estudiante: 'EDGAR JOSÉ ERAZO RAMÍREZ',
    edad_estudiante: '16',
    anio_lectivo: '2026',
    grado_estudiante: 'NOVENO GRADO',
    nivel_estudiante: 'TERCER CICLO',
    cuota_matricula: '200.00',
    cuota_mensual: '85.00',
    fecha_emision_letras: '2 días del mes de enero de dos mil veintiséis'
  });

  const handleLogout = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/login');
  };

  // Los datos de muestra de la vista previa usan el ciclo escolar activo
  useEffect(() => {
    configService.getConfigMatricula().then(config => {
      setStudentData(prev => ({
        ...prev,
        anio_lectivo: config.anioMatricula.toString(),
        cuota_matricula: config.cuotaMatricula.toFixed(2),
        cuota_mensual: config.cuotaMensualidad.toFixed(2),
      }));
    }).catch(() => { /* se queda la muestra por defecto */ });
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'configuracion', 'plantilla_contrato'));
        if (docSnap.exists() && docSnap.data().texto_base) {
          setTemplateText(docSnap.data().texto_base);
          if (docSnap.data().datos_institucionales) {
            setDatosInstitucionales({ ...DEFAULT_INSTITUCIONAL, ...docSnap.data().datos_institucionales });
          }
        } else {
          // Si no existe, guardamos la plantilla por defecto inmediatamente para que el alumno no vea error
          await setDoc(doc(db, 'configuracion', 'plantilla_contrato'), { texto_base: DEFAULT_TEMPLATE, datos_institucionales: DEFAULT_INSTITUCIONAL });
        }
      } catch (error) {
        console.error("Error al cargar la plantilla de Firebase", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'configuracion', 'plantilla_contrato'), {
        texto_base: templateText,
        datos_institucionales: datosInstitucionales,
        ultima_actualizacion: new Date().toISOString()
      }, { merge: true });
      alert("¡Contrato actualizado correctamente para todos los alumnos!");
    } catch (error) {
      alert("Error al guardar en Firebase.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleInstitucionalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDatosInstitucionales({ ...datosInstitucionales, [e.target.name]: e.target.value });
  };

  const handleRestaurarPlantilla = () => {
    if (window.confirm('Esto reemplazará el texto del editor con la plantilla oficial más reciente (la que usa los campos de Director editables). Tus cambios no guardados en el texto se perderán. ¿Continuar?')) {
      setTemplateText(DEFAULT_TEMPLATE);
    }
  };

  const getRenderedContract = () => {
    // Combinamos datos institucionales + datos del estudiante para resolver TODOS los {{...}}
    const data: Record<string, string> = { ...datosInstitucionales, ...studentData };
    return templateText.replace(/{{([^}]+)}}/g, (_m, key) => {
      const val = data[key.trim()];
      return val !== undefined && val !== '' ? val : '____________________';
    });
  };

  return (
    <div className="admin-contrato-layout">
      
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="contrato-main">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/admin/recursos" className="btn-back">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            Volver a Recursos Internos
          </Link>
        </div>

        <header className="contrato-header">
          <div className="header-titles">
            <h1>Gestor de Contratos Educativos</h1>
            <p>Edita las cláusulas globales o previsualiza cómo se generan los documentos con los datos de la base de datos.</p>
          </div>
        </header>

        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v.64c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-.64z" /></svg>
            Previsualizar e Imprimir
          </button>
          <button 
            className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
            Editar Plantilla Completa
          </button>
        </div>

        {activeTab === 'preview' ? (
          <div className="contrato-grid">
            {/* Formulario de Variables (Simulando lo que trae la DB) */}
            <div className="controls-panel">
              <h3>Simulador de Base de Datos</h3>
              <p className="help-text" style={{marginBottom: '2rem'}}>Al modificar estos campos, simulas cómo el sistema inyecta la información del estudiante y su padre/responsable en las 26 cláusulas del contrato.</p>
              
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.9rem' }}>Datos del Responsable</h4>
                <div className="form-group"><label>Nombre Completo</label><input type="text" name="nombre_responsable" value={studentData.nombre_responsable} onChange={handleInputChange} /></div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}><label>Edad</label><input type="text" name="edad_responsable" value={studentData.edad_responsable} onChange={handleInputChange} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label>Nacionalidad</label><input type="text" name="nacionalidad_responsable" value={studentData.nacionalidad_responsable} onChange={handleInputChange} /></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}><label>Profesión</label><input type="text" name="profesion_responsable" value={studentData.profesion_responsable} onChange={handleInputChange} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label>Estado Civil</label><input type="text" name="estado_civil_responsable" value={studentData.estado_civil_responsable} onChange={handleInputChange} /></div>
                </div>
                <div className="form-group"><label>DUI</label><input type="text" name="dui_responsable" value={studentData.dui_responsable} onChange={handleInputChange} /></div>
                <div className="form-group"><label>Domicilio</label><input type="text" name="domicilio_responsable" value={studentData.domicilio_responsable} onChange={handleInputChange} /></div>
              </div>

              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '0.9rem' }}>Datos del Estudiante</h4>
                <div className="form-group"><label>Nombre del Estudiante</label><input type="text" name="nombre_estudiante" value={studentData.nombre_estudiante} onChange={handleInputChange} /></div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}><label>Edad</label><input type="text" name="edad_estudiante" value={studentData.edad_estudiante} onChange={handleInputChange} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label>Año Lectivo</label><input type="text" name="anio_lectivo" value={studentData.anio_lectivo} onChange={handleInputChange} /></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}><label>Grado</label><input type="text" name="grado_estudiante" value={studentData.grado_estudiante} onChange={handleInputChange} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label>Nivel</label><input type="text" name="nivel_estudiante" value={studentData.nivel_estudiante} onChange={handleInputChange} /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Cuota Matrícula ($)</label><input type="text" name="cuota_matricula" value={studentData.cuota_matricula} onChange={handleInputChange} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Mensualidad ($)</label><input type="text" name="cuota_mensual" value={studentData.cuota_mensual} onChange={handleInputChange} /></div>
              </div>

              <button className="btn-primary" onClick={() => window.print()} style={{ marginTop: '1rem' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v.64c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-.64z" /></svg>
                Imprimir Prueba
              </button>
            </div>

            {/* Vista Previa de la Hoja A4 */}
            <div className="preview-panel">
              <div className="a4-sheet">
                {getRenderedContract()}
              </div>
            </div>
          </div>

        ) : (

          /* Panel de Edición de Plantilla Base */
          <div className="controls-panel" style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* DATOS DEL DIRECTOR / REPRESENTANTE LEGAL (editables) */}
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ color: '#4f46e5', marginTop: 0 }}>Datos del Director y Representante Legal</h3>
              <p className="help-text">Estos datos se insertan automáticamente en el contrato (intro, cláusulas PRIMERA y QUINTA, firma y "DOY FE"). Si cambia el director, edítalos aquí una sola vez.</p>

              <div className="form-group"><label>Nombre del Director</label><input type="text" name="director_nombre" value={datosInstitucionales.director_nombre} onChange={handleInstitucionalChange} /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Edad</label><input type="text" name="director_edad" value={datosInstitucionales.director_edad} onChange={handleInstitucionalChange} /></div>
                <div className="form-group" style={{ flex: 2 }}><label>Cargo</label><input type="text" name="director_cargo" value={datosInstitucionales.director_cargo} onChange={handleInstitucionalChange} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}><label>Condición</label><input type="text" name="director_condicion" value={datosInstitucionales.director_condicion} onChange={handleInstitucionalChange} /></div>
                <div className="form-group" style={{ flex: 1 }}><label>Nacionalidad</label><input type="text" name="director_nacionalidad" value={datosInstitucionales.director_nacionalidad} onChange={handleInstitucionalChange} /></div>
              </div>
              <div className="form-group"><label>Domicilio</label><input type="text" name="director_domicilio" value={datosInstitucionales.director_domicilio} onChange={handleInstitucionalChange} /></div>
              <div className="form-group">
                <label>Documento de identidad (texto completo, como aparece en el contrato)</label>
                <textarea name="director_documento" value={datosInstitucionales.director_documento} onChange={handleInstitucionalChange} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', background: '#f8fafc' }} />
              </div>

              <div className="form-group"><label>Nombre del Representante Legal (Presidente)</label><input type="text" name="representante_nombre" value={datosInstitucionales.representante_nombre} onChange={handleInstitucionalChange} /></div>
              <div className="form-group"><label>Cargo del Representante Legal</label><input type="text" name="representante_cargo" value={datosInstitucionales.representante_cargo} onChange={handleInstitucionalChange} /></div>
            </div>

            <h3>Redacción Global de Cláusulas</h3>
            <p className="help-text">Todo el texto que escribas aquí, incluyendo las 26 cláusulas, será el machote oficial. No borres las etiquetas entre llaves <span className="tag-badge">{'{{nombre_estudiante}}'}</span> ni <span className="tag-badge">{'{{director_nombre}}'}</span>, ya que son los espacios que el sistema llena automáticamente.</p>

            <textarea
              className="template-editor"
              style={{ minHeight: '800px' }}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              disabled={loading}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleRestaurarPlantilla}
                style={{ background: 'transparent', color: '#4f46e5', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '0.9rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Restaurar plantilla oficial (con campos de Director)
              </button>
              <button
                className="btn-primary"
                style={{ width: 'auto', padding: '1rem 3rem', marginTop: 0 }}
                onClick={handleSaveTemplate}
                disabled={saving || loading}
              >
                {saving ? 'Guardando en la Nube...' : 'Guardar y Publicar Documento Legal Oficial'}
              </button>
            </div>
          </div>

        )}

      </main>
    </div>
  );
}