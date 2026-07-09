// src/types/index.ts

// 1. Reemplazamos las importaciones rotas definiendo los tipos aquí mismo:
export type UserRole = 'admin' | 'director' | 'teacher' | 'psychologist' | 'secretary' | 'accountant' | 'hr' | 'librarian' | 'counselor' | 'it_support' | 'nurse' | 'parent' | 'student' | 'scholarship';
export type UserPermissions = string[];

// User interface
export interface User {
  uid: string;
  email: string;
  role: UserRole;
  permissions?: UserPermissions;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

// Admission interface
// Archivo subido por la familia que requiere revisión del admin (pago, contrato)
export interface AdmissionFileReview {
  fileUrl: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
}

export interface Admission {
  id: string;
  institutionalPersonId?: string;
  psychologyCaseId?: string;
  // Student info
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: Date;
  gender: 'M' | 'F';
  previousSchool?: string;
  gradeApplying: string;
  // Parent/Guardian info
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  parentRelationship: string;
  linkedSiblingCarnet?: string;
  linkedSiblingName?: string;
  // Address - El Salvador structure
  departamento: string;
  distrito: string;
  municipio: string;
  direccion: string;
  // Additional
  howDidYouHear?: string;
  comments?: string;
  // Status
status: 'pending' | 'evaluations' | 'interview' | 'approved' | 'rejected' | 'enrolled';
  applicationDate: Date;
  // Expediente digital llenado por la familia en el portal (mismos datos que
  // tiene un alumno de antiguo ingreso: NIE, salud, familia, transporte, sostenedor)
  expedienteDigital?: Record<string, string>;
  expedienteCompletado?: boolean;
  // Consentimiento de tratamiento de datos personales (obligatorio: se manejan
  // datos sensibles de menores). Se registra al iniciar la solicitud.
  privacyConsent?: {
    accepted: boolean;
    acceptedAt: Date;
    policyVersion: string;   // versión del texto de política aceptada
    acceptedByEmail?: string;
  };
  carnet?: string;                // Carnet institucional asignado al aprobar (8 dígitos, se usa en el NPE)
  paymentReceipt?: AdmissionFileReview;   // Comprobante de pago subido por la familia (colecturía)
  signedContract?: AdmissionFileReview;   // Contrato firmado subido por la familia (auditoría legal)
  documents: string[];
  accessCodeUsed?: string;
  enrollmentYear?: number;        // Año de matrícula (viene del código de acceso)
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // ============================================
  // RESULTADO FINAL DE ADMISIÓN
  // ============================================
  finalDecision?: {
    result: 'approved' | 'rejected';
    decidedBy: string;
    decidedByName?: string;
    decidedAt: Date;
    observations?: string;           // Observaciones generales
    rejectionReasons?: string[];     // Motivos de rechazo (si aplica)
    recommendations?: string[];      // Recomendaciones (cursos, refuerzo, etc.)
    interviewDate?: Date;            // Fecha de entrevista/entrega de resultados
    interviewNotes?: string;         // Notas de la entrevista
    // Para rechazados - permitir ver notas
    canViewResults?: boolean;        // Si el aspirante puede ver sus resultados detallados
    rejectionMessage?: string;       // Mensaje personalizado de rechazo
  };
  
  // Resolución de la entrevista psicológica (comunicada al aspirante)
  interviewResolution?: {
    decision: 'approved' | 'pending' | 'rejected'; // Resultado de la entrevista
    message: string;                    // Mensaje para el aspirante/padre
    strengths: string[];                // Fortalezas observadas
    areasToImprove: string[];           // Áreas a mejorar
    recommendations: string;            // Recomendaciones
    nextSteps: string;                  // Próximos pasos
    notifyParent: boolean;              // Si se debe notificar al padre
    resolvedBy: string;                 // Quién dio la resolución
    resolvedByName: string;             // Nombre de quién resolvió
    resolvedAt: Date;                   // Cuándo se resolvió
  };
  
  // Credenciales asignadas (Microsoft/Institucionales)
  assignedCredentials?: {
    microsoftEmail?: string;         // Email institucional de Microsoft (ej: estudiante@colegio.edu.sv)
    microsoftPassword?: string;      // Contraseña inicial (temporal)
    studentCode?: string;            // Código de estudiante (ej: EST2025001)
    assignedBy?: string;             // Quién asignó las credenciales
    assignedByName?: string;         // Nombre de quién asignó
    assignedAt?: Date;               // Cuándo se asignaron
    notes?: string;                  // Notas adicionales
    firebaseUserId?: string;         // ID del usuario creado en Firebase Auth
    microsoftUserId?: string;        // ID (objectId) del usuario creado en Microsoft 365
    teamsEnabled?: boolean;          // Si ya tiene acceso a Teams
    welcomeEmailSent?: boolean;      // Si se envió email de bienvenida
    // Estado de la provisión real en Microsoft 365 (Fase 2 - vía backend/Graph)
    provisioningStatus?: 'not_started' | 'pending' | 'provisioned' | 'failed';
    provisioningError?: string;      // Detalle del error si la provisión falló
    applyingForScholarship?: boolean; // Si el aspirante optó por aplicar a beca Fundación LYRA
    // Examen de nivelación de inglés (solo 7mo+)
    englishExam?: {
      scheduledDate?: string;        // Fecha programada
      scheduledTime?: string;        // Hora programada
      location?: string;             // Lugar del examen
      scheduledBy?: string;          // Quién lo programó
      scheduledByName?: string;      // Nombre de quién lo programó
      scheduledAt?: Date;            // Cuándo se programó
      completed?: boolean;           // Si ya se completó
      level?: string;                // Nivel asignado después del examen
    };
  };
}

// Access Code Usage Record
export interface CodeUsage {
  name: string;
  grade: string;
  email: string;
  phone: string;
  usedAt: Date;
}

// Access Code interface
export interface AccessCode {
  id: string;
  code: string;
  description?: string;
  year: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  gradeLevel: string;
  createdBy: string;
  creatorName?: string;
  usedBy?: CodeUsage[];
}

// Student interface
export interface Student {
  id: string;
  institutionalPersonId?: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  grade: string;
  section: string;
  enrollmentDate: Date;
  parentId?: string;
  photoURL?: string;
  address?: string;
  phone?: string;
  status: 'active' | 'inactive';
  
  // Acceso al portal (compartido con padres)
  hasPortalAccess?: boolean;
  requirePasswordChange?: boolean;  // Debe cambiar contraseña en primer login
  lastPasswordChange?: Date;
  studentCode?: string; // Código de estudiante para login (ej: "EST2025001")
  
  // Credenciales Microsoft institucionales
  microsoftEmail?: string;           // Email institucional de Microsoft
  admissionId?: string;              // Referencia a la admisión original (si vino por admisión)
}

// Teacher interface
export interface Teacher {
  id: string;
  institutionalPersonId?: string;
  staffMemberId?: string; // Vinculo opcional con RRHH (staffMembers)
  firstName: string;
  lastName: string;
  email: string;
  subjects: string[];
  grades: string[];
  phone?: string;
  photoURL?: string;
  hireDate: Date;
  status: 'active' | 'inactive';
  
  // Gestión de acceso (docentes tienen doble registro: aquí + systemUsers)
  systemUserId?: string; // Referencia al registro en systemUsers para permisos
  hasSystemAccess?: boolean; // Si tiene acceso al panel administrativo
  requirePasswordChange?: boolean;
  lastPasswordChange?: Date;
}

// Course interface
export interface Course {
  id: string;
  name: string;
  description?: string;
  grade: string;
  section: string;
  teacherId: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  students: string[];
  createdAt: Date;
}

// Grade/Score interface
export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  period: string; // e.g., "Q1", "Q2", "Semester 1"
  scores: {
    category: string; // e.g., "Homework", "Exam", "Participation"
    value: number;
    maxValue: number;
    date: Date;
  }[];
  average: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance interface
export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  createdAt: Date;
}

// Parent interface
export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  childrenIds: string[];
  photoURL?: string;
  
  // Acceso al portal (usa la misma contraseña que el estudiante)
  requirePasswordChange?: boolean;
  lastPasswordChange?: Date;
  linkedStudentCode?: string; // Código del estudiante principal para login
}

// Document interface
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'excel' | 'other';
  url: string;
  uploadedBy: string;
  uploadDate: Date;
  category: 'report' | 'assignment' | 'certificate' | 'other';
  relatedTo?: {
    type: 'student' | 'teacher' | 'course';
    id: string;
  };
}

// ============================================
// ADMISSION EVALUATION SYSTEM
// ============================================

// Tipo de evaluación
export type EvaluationType = 'psychological' | 'academic' | 'english' | 'psychological_interview' | 'interview';

// Estado de la evaluación
export type EvaluationStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

// Control de asistencia para entrevistas o citas programadas
export type EvaluationAttendanceStatus = 'pending' | 'present' | 'absent';

// Resultado de la evaluación
export type EvaluationResult = 'approved' | 'reviewed' | 'needs-review' | 'rejected' | 'pending';

// Fase de evaluación (configuración general)
export interface EvaluationPhase {
  id: string;
  name: string;
  type: EvaluationType;
  description: string;
  order: number; // Orden en el proceso (1, 2, 3...)
  isRequired: boolean;
  passingScore?: number; // Puntaje mínimo para aprobar (si aplica)
  maxScore?: number;
  estimatedDuration: number; // Duración en minutos
  isActive: boolean;
}

// Evaluador (docente o psicólogo asignado)
export interface Evaluator {
  id: string;
  name: string;
  email: string;
  type: 'teacher' | 'psychologist' | 'admin';
  specialization?: string; // Ej: "Matemáticas", "Psicología Infantil"
  canEvaluate: EvaluationType[]; // Qué tipos puede evaluar
  isActive: boolean;
}

// Evaluación individual de un estudiante (Optimizado sin formularios clínicos)
export interface AdmissionEvaluation {
  id: string;
  admissionId: string; // Referencia a la solicitud
  studentName: string; // Para fácil referencia
  phaseId: string;
  phaseType: EvaluationType;
  phaseName: string;
  
  // Programación (Sirve tanto para la cita en compus como para la cita psicológica física)
  scheduledDate?: Date;
  scheduledTime?: string; // "09:00"
  location?: string; // "Aula 101", "Sala de Entrevistas"
  
  // Evaluador
  evaluatorId?: string;
  evaluatorName?: string;

  // Asistencia / seguimiento operativo
  attendanceStatus?: EvaluationAttendanceStatus;
  attendanceMarkedAt?: Date;
  attendanceMarkedBy?: string;
  attendanceMarkedByName?: string;
  rescheduledCount?: number;
  autoScheduled?: boolean;
  manualAccessEnabled?: boolean;
  manualAccessEnabledAt?: Date;
  manualAccessEnabledBy?: string;
  manualAccessEnabledByName?: string;
  
  // Resultado
  status: EvaluationStatus;
  score?: number;
  maxScore?: number;
  result?: EvaluationResult;
  observations?: string;
  recommendations?: string;
  notes?: string; // Notas adicionales generales
  
  // Examen en línea (Exclusivo para la fase académica en sitio)
  examEnabled?: boolean; 
  examStartedAt?: Date;
  examCompletedAt?: Date;
  
  // Configuración de materias para examen académico
  subjectConfigs?: {
    subjectId: string;
    subjectName: string;
    subjectIcon: string;
    enabled: boolean;
    questionCount: number;
  }[];
  
  // Control de plantillas dinámicas académicas
  templateId?: string; // ID de la plantilla del examen
  answers?: Record<string, string>; // Respuestas del alumno: { "id_pregunta": "respuesta" }

  // Metadatos
  scheduledBy?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Jornada de evaluación (para programar múltiples estudiantes)
export interface EvaluationSession {
  id: string;
  name: string; // "Jornada Examen Psicológico - Diciembre 2025"
  type: EvaluationType;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  currentCapacity: number;
  evaluatorIds: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

// Resumen del progreso de admisión de un estudiante
export interface AdmissionProgress {
  admissionId: string;
  studentName: string;
  currentPhase: number;
  totalPhases: number;
  phases: {
    phaseId: string;
    phaseName: string;
    type: EvaluationType;
    order: number;
    status: EvaluationStatus;
    result?: EvaluationResult;
    scheduledDate?: Date;
    score?: number;
  }[];
  overallStatus: 'in-process' | 'approved' | 'rejected' | 'on-hold';
}

// ============================================
// GLOBAL EVALUATION SCHEDULE (Fechas Globales)
// ============================================

export interface GlobalEvaluationSchedule {
  id: string;
  year: number; // Año lectivo (2026)
  type: EvaluationType;
  name: string; 
  date: Date;
  startTime: string; 
  endTime: string; 
  location: string;
  instructions?: string; // Instrucciones para los padres
  evaluatorIds: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Para calificación masiva
export interface BulkGradeEntry {
  evaluationId: string;
  admissionId: string;
  studentName: string;
  gradeApplying: string;
  result: EvaluationResult;
  score?: number;
  observations?: string;
}

export interface EvaluationQuestion {
  id: string;
  question: string;
  subject?: string;   // Materia/sección a la que pertenece la pregunta (Ej: "Matemática", "Ciencias Naturales")
  imageUrl?: string;  // Imagen opcional de apoyo (Ej: foto de la ecuación en lugar de escribirla)
  options: string[]; // Ej: ["2", "4", "6", "8"]
  correctAnswer: string;
}

export interface EvaluationTemplate {
  id: string;
  title: string;
  grade: string; // Ej: "Kinder 5"
  subject?: string; // Resumen de las materias que componen el examen (Ej: "Matemática, Ciencias Naturales")
  type: 'academic';
  isActive: boolean;
  questions: EvaluationQuestion[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ADMISSION DOCUMENTS SYSTEM
// ============================================

export type AdmissionDocumentType = 
  | 'birth_certificate'    
  | 'previous_grades'      
  | 'recent_photo'         
  | 'vaccination_card'     
  | 'identification'       
  | 'other'              
  | 'financial_solvency'
  | 'grade_certificate';

export type DocumentReviewStatus = 
  | 'pending'     
  | 'approved'    
  | 'rejected'    
  | 'resubmitted'; 

export interface AdmissionDocument {
  id: string;
  admissionId: string;
  type: AdmissionDocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number; 
  mimeType: string;
  status: DocumentReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string; 
  version: number;
  previousVersions?: {
    fileUrl: string;
    uploadedAt: Date;
    rejectionReason?: string;
  }[];
  uploadedAt: Date;
  updatedAt: Date;
}

export interface RequiredDocument {
  type: AdmissionDocumentType;
  name: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string[]; 
  maxSizeMB: number;
}

export interface AdmissionDocumentsStatus {
  admissionId: string;
  totalRequired: number;
  uploaded: number;
  approved: number;
  rejected: number;
  pending: number;
  isComplete: boolean; 
  documents: AdmissionDocument[];
}

export type AdmissionStage = 
  | 'form_submitted'      
  | 'documents_pending'   
  | 'documents_review'    
  | 'documents_complete'  
  | 'evaluation_pending'  
  | 'evaluation_complete' 
  | 'dictamen_pending'    
  | 'decision_pending'    
  | 'enrollment_pending'  
  | 'enrollment_process'  
  | 'enrolled'            
  | 'rejected';

// ============================================
// ENROLLMENT SYSTEM (Matrícula)
// ============================================

export type EnrollmentStatus = 
  | 'pending'           
  | 'form_pending'      
  | 'form_submitted'    
  | 'payment_pending'   
  | 'payment_review'    
  | 'payment_approved'  
  | 'contract_pending'  
  | 'contract_generated'
  | 'contract_uploaded' 
  | 'contract_approved' 
  | 'completed';        

export interface EnrollmentData {
  id: string;
  admissionId: string;
  studentName: string;
  gradeAssigned: string;
  sectionAssigned?: string;
  academicYear: number;
  status: EnrollmentStatus;
  additionalInfo?: {
    bloodType?: string;
    allergies?: string;
    medicalConditions?: string;
    medications?: string;
    emergencyContact1Name?: string;
    emergencyContact1Phone?: string;
    emergencyContact1Relationship?: string;
    emergencyContact2Name?: string;
    emergencyContact2Phone?: string;
    emergencyContact2Relationship?: string;
    authorizedPickup?: string[]; 
    transportMethod?: 'parent' | 'bus' | 'walk' | 'other';
    busRoute?: string;
    additionalNotes?: string;
  };
  payments: any[]; // Cambiado a any[] o define EnrollmentPayment si lo tienes separado
  totalAmount: number;
  amountPaid: number;
  contract?: any; // Cambiado a any o define EnrollmentContract si aplica
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

// Pago de matrícula
export interface EnrollmentPayment {
  id: string;
  enrollmentId: string;
  concept: 'matricula' | 'primera_cuota' | 'uniforme' | 'materiales' | 'otros';
  conceptName: string;
  amount: number;
  
  // Comprobante
  receiptUrl?: string;
  receiptFileName?: string;
  paymentMethod?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  paymentReference?: string; // Número de referencia
  paymentDate?: Date;
  
  // Estado
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Contrato de matrícula
export interface EnrollmentContract {
  id: string;
  enrollmentId: string;
  
  // Contrato generado por el sistema
  generatedUrl?: string;
  generatedAt?: Date;
  generatedBy?: string;
  contractNumber: string; // Número de contrato único
  
  // Contrato firmado subido por el padre
  signedUrl?: string;
  signedFileName?: string;
  uploadedAt?: Date;
  
  // Estado
  status: 'pending' | 'generated' | 'downloaded' | 'uploaded' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  
  // Datos del contrato
  contractData: {
    studentFullName: string;
    studentGrade: string;
    parentFullName: string;
    parentDUI: string;
    parentAddress: string;
    academicYear: number;
    monthlyFee: number;
    enrollmentFee: number;
    signatureDate?: Date;
  };
}

// Configuración de costos por grado
export interface GradeFees {
  gradeCode: string;          // Código del grado (01, 02, etc.)
  grade: string;              // Nombre del grado
  enrollmentFee: number;      // Matrícula
  monthlyFee: number;         // Colegiatura mensual
  academicYear: number;       // Año lectivo
  materialsFee?: number;      // Materiales
  uniformFee?: number;        // Uniforme
  otherFees?: {
    concept: string;
    amount: number;
  }[];
}

// Resumen del proceso de matrícula
export interface EnrollmentProgress {
  enrollmentId: string;
  admissionId: string;
  studentName: string;
  status: EnrollmentStatus;
  steps: {
    step: string;
    label: string;
    status: 'completed' | 'current' | 'pending';
    completedAt?: Date;
  }[];
  pendingActions: string[];
}

