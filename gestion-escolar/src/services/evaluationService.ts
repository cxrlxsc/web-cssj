// src/services/evaluationService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteField,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// 1. Ajuste a la ruta correcta de tu configuración
import { db } from '../firebase/config';

// 2. Ajuste para importar tipos correctamente usando 'type'
import type { 
  EvaluationPhase, 
  AdmissionEvaluation, 
  EvaluationSession,
  Evaluator,
  EvaluationType,
  EvaluationStatus,
  EvaluationResult,
  GlobalEvaluationSchedule,
  BulkGradeEntry
} from '../types';

// ============================================
// El resto de tu código original empieza aquí:
// ============================================

const EVALUATION_DATE_FIELDS = new Set([
  'scheduledDate',
  'attendanceMarkedAt',
  'manualAccessEnabledAt',
  'scheduledAt',
  'completedAt',
  'examStartedAt',
  'examCompletedAt',
  'createdAt',
  'updatedAt',
]);

function toTimestamp(value: unknown): Timestamp {
  const normalized = value instanceof Date ? value : new Date(value as string | number);
  return Timestamp.fromDate(normalized);
}

function serializeEvaluationForCreate(data: Omit<AdmissionEvaluation, 'id'>): Record<string, any> {
  const serialized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    serialized[key] = EVALUATION_DATE_FIELDS.has(key) ? toTimestamp(value) : value;
  }

  return serialized;
}

function serializeEvaluationForUpdate(data: Partial<AdmissionEvaluation>): Record<string, any> {
  const serialized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue;
    if (value === undefined) {
      serialized[key] = deleteField();
      continue;
    }
    serialized[key] = EVALUATION_DATE_FIELDS.has(key) ? toTimestamp(value) : value;
  }

  return serialized;
}

export const evaluationService = {
  // Keep only one active phase per type (first by configured order)
  getUniquePhasesByType(phases: EvaluationPhase[]): EvaluationPhase[] {
    const seen = new Set<EvaluationType>();
    const unique: EvaluationPhase[] = [];

    for (const phase of phases) {
      if (seen.has(phase.type)) continue;
      seen.add(phase.type);
      unique.push(phase);
    }

    return unique;
  },

  // ============================================
  // PHASES CONFIGURATION
  // ============================================
  
  // Get all evaluation phases
  async getPhases(): Promise<EvaluationPhase[]> {
    const phasesRef = collection(db, 'evaluationPhases');
    const q = query(phasesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EvaluationPhase));
  },

  // Create default phases (run once on setup)
  async createDefaultPhases(): Promise<void> {
    const defaultPhases: Omit<EvaluationPhase, 'id'>[] = [
      {
        name: 'Examen Psicológico',
        type: 'psychological',
        description: 'Evaluación psicológica para determinar aptitudes y perfil del estudiante',
        order: 1,
        isRequired: true,
        estimatedDuration: 60,
        isActive: true
      },
      {
        name: 'Entrevista Psicológica',
        type: 'psychological_interview',
        description: 'Entrevista individual con el estudiante y sus padres/encargados para evaluación psicológica complementaria',
        order: 2,
        isRequired: true,
        estimatedDuration: 30,
        isActive: true
      },
      {
        name: 'Examen Académico',
        type: 'academic',
        description: 'Evaluación de conocimientos en matemáticas, lenguaje y cultura general',
        order: 3,
        isRequired: true,
        passingScore: 60,
        maxScore: 100,
        estimatedDuration: 90,
        isActive: true
      },
      {
        name: 'Examen de Inglés',
        type: 'english',
        description: 'Evaluación de conocimientos de inglés (solo para 7mo grado en adelante)',
        order: 4,
        isRequired: false, // Solo requerido para 7mo+
        passingScore: 60,
        maxScore: 100,
        estimatedDuration: 45,
        isActive: true
      }
    ];

    const phasesRef = collection(db, 'evaluationPhases');
    for (const phase of defaultPhases) {
      await addDoc(phasesRef, phase);
    }
  },

  // Update phase
  async updatePhase(id: string, data: Partial<EvaluationPhase>): Promise<void> {
    const docRef = doc(db, 'evaluationPhases', id);
    await updateDoc(docRef, data);
  },

  // ============================================
  // EVALUATORS
  // ============================================

  // Get all evaluators
  async getEvaluators(): Promise<Evaluator[]> {
    const evaluatorsRef = collection(db, 'evaluators');
    const snapshot = await getDocs(evaluatorsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Evaluator));
  },

  // Add evaluator
  async addEvaluator(evaluator: Omit<Evaluator, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'evaluators'), evaluator);
    return docRef.id;
  },

  // Update evaluator
  async updateEvaluator(id: string, data: Partial<Evaluator>): Promise<void> {
    const docRef = doc(db, 'evaluators', id);
    await updateDoc(docRef, data);
  },

  // ============================================
  // ADMISSION EVALUATIONS
  // ============================================

  // Get a single evaluation by ID
  async getEvaluation(evaluationId: string): Promise<AdmissionEvaluation | null> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
      scheduledAt: data.scheduledAt?.toDate?.() || data.scheduledAt,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as AdmissionEvaluation;
  },

  // Get evaluations for an admission
  async getEvaluationsForAdmission(admissionId: string): Promise<AdmissionEvaluation[]> {
    const evalsRef = collection(db, 'admissionEvaluations');
    const q = query(
      evalsRef, 
      where('admissionId', '==', admissionId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
        scheduledAt: data.scheduledAt?.toDate?.() || data.scheduledAt,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as AdmissionEvaluation;
    });
  },

  // Create evaluations for an approved admission
  async createEvaluationsForAdmission(
    admissionId: string, 
    studentName: string
  ): Promise<AdmissionEvaluation[]> {
    const phases = await this.getPhases();
    const activePhases = this.getUniquePhasesByType(phases.filter(p => p.isActive));
    const existingEvaluations = await this.getEvaluationsForAdmission(admissionId);
    const existingTypes = new Set(existingEvaluations.map(e => e.phaseType));
    const now = new Date();
    
    const evaluations: AdmissionEvaluation[] = [];
    
    for (const phase of activePhases) {
      // Avoid duplicated evaluations if they already exist for this admission
      if (existingTypes.has(phase.type)) {
        continue;
      }

      const evalData: Omit<AdmissionEvaluation, 'id'> = {
        admissionId,
        studentName,
        phaseId: phase.id,
        phaseType: phase.type,
        phaseName: phase.name,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      
      const docRef = await addDoc(collection(db, 'admissionEvaluations'), {
        ...evalData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      
      evaluations.push({
        id: docRef.id,
        ...evalData
      });
    }
    
    return evaluations;
  },

  // Schedule an evaluation
  async scheduleEvaluation(
    evaluationId: string,
    data: {
      scheduledDate: Date;
      scheduledTime: string;
      location?: string;
      evaluatorId?: string;
      evaluatorName?: string;
      scheduledBy: string;
    }
  ): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    await updateDoc(docRef, {
      scheduledDate: Timestamp.fromDate(data.scheduledDate),
      scheduledTime: data.scheduledTime,
      location: data.location || '',
      evaluatorId: data.evaluatorId || '',
      evaluatorName: data.evaluatorName || '',
      scheduledBy: data.scheduledBy,
      scheduledAt: Timestamp.fromDate(new Date()),
      status: 'scheduled',
      attendanceStatus: 'pending',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Complete/Grade an evaluation
  async completeEvaluation(
    evaluationId: string,
    data: {
      score?: number;
      maxScore?: number;
      result: EvaluationResult;
      observations?: string;
      recommendations?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    await updateDoc(docRef, {
      ...data,
      status: 'completed',
      completedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Update evaluation status
  async updateEvaluationStatus(evaluationId: string, status: EvaluationStatus): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Create a single evaluation
  async createEvaluation(data: Omit<AdmissionEvaluation, 'id'>): Promise<string> {
    const now = new Date();
    const docData = serializeEvaluationForCreate({
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    });

    const docRef = await addDoc(collection(db, 'admissionEvaluations'), docData);
    return docRef.id;
  },

  // Update evaluation with any data
  async updateEvaluation(evaluationId: string, data: Partial<AdmissionEvaluation>): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    const updateData = serializeEvaluationForUpdate(data);
    updateData.updatedAt = Timestamp.fromDate(new Date());

    await updateDoc(docRef, updateData);
  },

  getNextBusinessDay(baseDate: Date = new Date()): Date {
    const candidate = new Date(baseDate);
    candidate.setHours(8, 0, 0, 0);
    candidate.setDate(candidate.getDate() + 1);

    while (candidate.getDay() === 0 || candidate.getDay() === 6) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  },

  async ensurePsychologicalInterviewScheduled(
    admissionId: string,
    studentName: string,
    options?: {
      scheduledDate?: Date;
      scheduledTime?: string;
      location?: string;
      evaluatorId?: string;
      evaluatorName?: string;
      scheduledBy?: string;
      autoScheduled?: boolean;
      forceReschedule?: boolean;
      notes?: string;
    }
  ): Promise<string> {
    const evaluations = await this.getEvaluationsForAdmission(admissionId);
    const existingInterview = evaluations.find((evaluation) => evaluation.phaseType === 'psychological_interview');
    const shouldForceReschedule = options?.forceReschedule === true;

    if (
      existingInterview &&
      !shouldForceReschedule &&
      existingInterview.scheduledDate &&
      existingInterview.status !== 'cancelled'
    ) {
      return existingInterview.id;
    }

    const scheduledDate = options?.scheduledDate || this.getNextBusinessDay();
    const basePayload: Partial<AdmissionEvaluation> = {
      scheduledDate,
      scheduledTime: options?.scheduledTime || '08:00',
      location: options?.location || 'Oficina de Psicología',
      evaluatorId: options?.evaluatorId,
      evaluatorName: options?.evaluatorName,
      scheduledBy: options?.scheduledBy || 'system',
      scheduledAt: new Date(),
      status: 'scheduled',
      attendanceStatus: 'pending',
      attendanceMarkedAt: undefined,
      attendanceMarkedBy: undefined,
      attendanceMarkedByName: undefined,
      autoScheduled: options?.autoScheduled ?? true,
      notes: options?.notes,
    };

    if (existingInterview) {
      await this.updateEvaluation(existingInterview.id, {
        ...basePayload,
        completedAt: undefined,
        interviewSummary: shouldForceReschedule ? undefined : existingInterview.interviewSummary,
        interviewRecommendation: shouldForceReschedule ? undefined : existingInterview.interviewRecommendation,
        psychologyInterviewForm: shouldForceReschedule ? undefined : existingInterview.psychologyInterviewForm,
        rescheduledCount: shouldForceReschedule
          ? (existingInterview.rescheduledCount || 0) + 1
          : existingInterview.rescheduledCount || 0,
      });
      return existingInterview.id;
    }

    return this.createEvaluation({
      admissionId,
      studentName,
      phaseId: 'psychological_interview',
      phaseType: 'psychological_interview',
      phaseName: 'Entrevista Psicológica',
      status: 'scheduled',
      attendanceStatus: 'pending',
      scheduledDate,
      scheduledTime: options?.scheduledTime || '08:00',
      location: options?.location || 'Oficina de Psicología',
      evaluatorId: options?.evaluatorId,
      evaluatorName: options?.evaluatorName,
      scheduledBy: options?.scheduledBy || 'system',
      scheduledAt: new Date(),
      autoScheduled: options?.autoScheduled ?? true,
      notes: options?.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async markInterviewAttendance(
    evaluationId: string,
    attendanceStatus: 'present' | 'absent',
    actor: { uid: string; displayName: string }
  ): Promise<void> {
    await this.updateEvaluation(evaluationId, {
      attendanceStatus,
      attendanceMarkedAt: new Date(),
      attendanceMarkedBy: actor.uid,
      attendanceMarkedByName: actor.displayName,
      status: attendanceStatus === 'present' ? 'in-progress' : 'cancelled',
      autoScheduled: false,
    });
  },

  async enableExamManualAccess(
    evaluationId: string,
    actor: { uid: string; displayName: string }
  ): Promise<void> {
    await this.updateEvaluation(evaluationId, {
      examEnabled: true,
      manualAccessEnabled: true,
      manualAccessEnabledAt: new Date(),
      manualAccessEnabledBy: actor.uid,
      manualAccessEnabledByName: actor.displayName,
      status: 'scheduled',
    });
  },

  async acquireExamSessionLock(evaluationId: string, sessionId: string): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error('Evaluación no encontrada');
    }

    const data = snapshot.data();
    const activeSessionId = data.activeExamSessionId as string | undefined;
    const activeAt = data.activeExamSessionAt?.toDate?.() || data.activeExamSessionAt;

    const now = new Date();
    const activeAtDate = activeAt ? new Date(activeAt) : null;
    const lockExpired = !activeAtDate || (now.getTime() - activeAtDate.getTime()) > 2 * 60 * 1000;

    if (activeSessionId && activeSessionId !== sessionId && !lockExpired) {
      throw new Error('Ya existe una sesión activa para este examen en otro dispositivo.');
    }

    await updateDoc(docRef, {
      activeExamSessionId: sessionId,
      activeExamSessionAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });
  },

  async refreshExamSessionLock(evaluationId: string, sessionId: string): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      throw new Error('Evaluación no encontrada');
    }

    const data = snapshot.data();
    const activeSessionId = data.activeExamSessionId as string | undefined;

    if (activeSessionId && activeSessionId !== sessionId) {
      throw new Error('La sesión activa cambió en otro dispositivo.');
    }

    await updateDoc(docRef, {
      activeExamSessionAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async releaseExamSessionLock(evaluationId: string, sessionId: string): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return;
    }

    const data = snapshot.data();
    const activeSessionId = data.activeExamSessionId as string | undefined;

    if (activeSessionId && activeSessionId !== sessionId) {
      return;
    }

    await updateDoc(docRef, {
      activeExamSessionId: deleteField(),
      activeExamSessionAt: deleteField(),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Reset exam to allow student to retake it
  async resetExamForRetry(
    evaluationId: string,
    actor?: { uid: string; displayName: string }
  ): Promise<void> {
    const docRef = doc(db, 'admissionEvaluations', evaluationId);
    
    await updateDoc(docRef, {
      status: 'scheduled',
      examEnabled: true,
      manualAccessEnabled: true,
      manualAccessEnabledAt: Timestamp.fromDate(new Date()),
      manualAccessEnabledBy: actor?.uid || '',
      manualAccessEnabledByName: actor?.displayName || '',
      score: deleteField(),
      maxScore: deleteField(),
      result: deleteField(),
      observations: deleteField(),
      completedAt: deleteField(),
      examStartedAt: deleteField(),
      examCompletedAt: deleteField(),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // ============================================
  // EVALUATION SESSIONS (Jornadas)
  // ============================================

  // Get all sessions
  async getSessions(): Promise<EvaluationSession[]> {
    const sessionsRef = collection(db, 'evaluationSessions');
    const q = query(sessionsRef, orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || data.date,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      } as EvaluationSession;
    });
  },

  // Create session
  async createSession(session: Omit<EvaluationSession, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'evaluationSessions'), {
      ...session,
      date: Timestamp.fromDate(session.date as Date),
      createdAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  },

  // Update session
  async updateSession(id: string, data: Partial<EvaluationSession>): Promise<void> {
    const docRef = doc(db, 'evaluationSessions', id);
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date as Date);
    }
    await updateDoc(docRef, updateData);
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  // Get all pending evaluations (for evaluator dashboard)
  async getPendingEvaluations(evaluatorId?: string): Promise<AdmissionEvaluation[]> {
    const evalsRef = collection(db, 'admissionEvaluations');
    let q;
    
    if (evaluatorId) {
      q = query(
        evalsRef, 
        where('evaluatorId', '==', evaluatorId),
        where('status', 'in', ['scheduled', 'in-progress'])
      );
    } else {
      q = query(
        evalsRef, 
        where('status', 'in', ['pending', 'scheduled', 'in-progress'])
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      } as AdmissionEvaluation;
    });
  },

  // Get evaluations by date (for calendar view)
  async getEvaluationsByDate(date: Date): Promise<AdmissionEvaluation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const evalsRef = collection(db, 'admissionEvaluations');
    const q = query(
      evalsRef,
      where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledDate', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
      } as AdmissionEvaluation;
    });
  },

  // Check if all evaluations are completed for an admission
  async checkAdmissionEvaluationsComplete(admissionId: string): Promise<{
    allComplete: boolean;
    allPassed: boolean;
    summary: { phase: string; status: EvaluationStatus; result?: EvaluationResult }[];
  }> {
    const evaluations = await this.getEvaluationsForAdmission(admissionId);
    
    const summary = evaluations.map(e => ({
      phase: e.phaseName,
      status: e.status,
      result: e.result
    }));
    
    const allComplete = evaluations.every(e => e.status === 'completed');
    const allPassed = evaluations.every(e => e.result === 'approved');
    
    return { allComplete, allPassed, summary };
  },

  // ============================================
  // GLOBAL EVALUATION SCHEDULE (Fechas Globales)
  // ============================================

  // Get global schedules for a year
  async getGlobalSchedules(year: number): Promise<GlobalEvaluationSchedule[]> {
    const schedulesRef = collection(db, 'globalEvaluationSchedules');
    const q = query(schedulesRef, where('year', '==', year), orderBy('date', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || data.date,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as GlobalEvaluationSchedule;
    });
  },

  // Get active global schedule by type
  async getActiveScheduleByType(type: EvaluationType, year: number): Promise<GlobalEvaluationSchedule | null> {
    const schedulesRef = collection(db, 'globalEvaluationSchedules');
    const q = query(
      schedulesRef, 
      where('year', '==', year),
      where('type', '==', type),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate?.() || data.date,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as GlobalEvaluationSchedule;
  },

  // Save global schedule
  async saveGlobalSchedule(schedule: Omit<GlobalEvaluationSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    
    // Check if exists for this type and year
    const existing = await this.getActiveScheduleByType(schedule.type, schedule.year);
    
    if (existing) {
      // Update existing
      const docRef = doc(db, 'globalEvaluationSchedules', existing.id);
      await updateDoc(docRef, {
        ...schedule,
        date: Timestamp.fromDate(schedule.date as Date),
        updatedAt: Timestamp.fromDate(now),
      });
      return existing.id;
    } else {
      // Create new
      const docRef = await addDoc(collection(db, 'globalEvaluationSchedules'), {
        ...schedule,
        date: Timestamp.fromDate(schedule.date as Date),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    }
  },

  // Create evaluations with global schedule dates
  async createEvaluationsWithGlobalDates(
    admissionId: string, 
    studentName: string,
    gradeApplying: string,
    year: number
  ): Promise<AdmissionEvaluation[]> {
    const phases = await this.getPhases();
    const activePhases = this.getUniquePhasesByType(phases.filter(p => p.isActive));
    const schedules = await this.getGlobalSchedules(year);
    const existingEvaluations = await this.getEvaluationsForAdmission(admissionId);
    const existingTypes = new Set(existingEvaluations.map(e => e.phaseType));
    const now = new Date();
    
    // Determinar si es 7mo grado o superior (para examen de inglés)
    const gradesRequiringEnglish = ['7mo_grado', '8vo_grado', '9no_grado', '1er_año', '2do_año', '7mo', '8vo', '9no', '1ro_bach', '2do_bach'];
    const requiresEnglishExam = gradesRequiringEnglish.some(g => 
      gradeApplying.toLowerCase().includes(g.toLowerCase()) || 
      gradeApplying.toLowerCase().replace('_', ' ').includes(g.toLowerCase().replace('_', ' '))
    );
    
    const evaluations: AdmissionEvaluation[] = [];
    
    for (const phase of activePhases) {
      // Avoid duplicated evaluations if they already exist for this admission
      if (existingTypes.has(phase.type)) {
        continue;
      }

      // Skip English exam if grade is below 7mo
      if (phase.type === 'english' && !requiresEnglishExam) {
        continue;
      }
      
      // Find global schedule for this phase type
      const globalSchedule = schedules.find(s => s.type === phase.type && s.isActive);
      
      const evalData: Omit<AdmissionEvaluation, 'id'> = {
        admissionId,
        studentName,
        phaseId: phase.id,
        phaseType: phase.type,
        phaseName: phase.name,
        status: globalSchedule ? 'scheduled' : 'pending',
        scheduledDate: globalSchedule?.date,
        scheduledTime: globalSchedule?.startTime,
        location: globalSchedule?.location,
        createdAt: now,
        updatedAt: now,
      };
      
      // Preparar datos para Firestore (sin campos undefined)
      const firestoreData: any = {
        admissionId,
        studentName,
        phaseId: phase.id,
        phaseType: phase.type,
        phaseName: phase.name,
        status: globalSchedule ? 'scheduled' : 'pending',
        gradeApplying,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };
      
      // Solo agregar campos opcionales si existen
      if (globalSchedule?.date) {
        firestoreData.scheduledDate = Timestamp.fromDate(globalSchedule.date as Date);
      }
      if (globalSchedule?.startTime) {
        firestoreData.scheduledTime = globalSchedule.startTime;
      }
      if (globalSchedule?.location) {
        firestoreData.location = globalSchedule.location;
      }
      
      const docRef = await addDoc(collection(db, 'admissionEvaluations'), firestoreData);
      
      evaluations.push({
        id: docRef.id,
        ...evalData
      });
    }
    
    return evaluations;
  },

  // Apply global schedule to all pending evaluations of a type
  async applyGlobalScheduleToAll(scheduleId: string): Promise<number> {
    const scheduleDoc = await getDoc(doc(db, 'globalEvaluationSchedules', scheduleId));
    if (!scheduleDoc.exists()) {
      console.log('Schedule no encontrado:', scheduleId);
      return 0;
    }
    
    const scheduleData = scheduleDoc.data();
    console.log('Schedule data completo:', JSON.stringify(scheduleData));
    console.log('startTime del schedule:', scheduleData.startTime);
    
    // Convertir la fecha de Firestore Timestamp a Date
    const scheduleDate = scheduleData.date?.toDate?.() || new Date(scheduleData.date);
    console.log('Fecha a aplicar:', scheduleDate, 'Hora:', scheduleData.startTime);
    
    // Get all pending AND scheduled evaluations of this type (not completed)
    const evalsRef = collection(db, 'admissionEvaluations');
    
    // Primero verificar cuántas evaluaciones hay en total
    const allEvalsSnapshot = await getDocs(evalsRef);
    console.log('Total de evaluaciones en la BD:', allEvalsSnapshot.size);
    allEvalsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('Eval:', doc.id, 'tipo:', data.phaseType, 'status:', data.status, 'student:', data.studentName);
    });
    
    const q = query(
      evalsRef,
      where('phaseType', '==', scheduleData.type),
      where('status', 'in', ['pending', 'scheduled']) // Incluir las ya programadas también
    );
    const snapshot = await getDocs(q);
    
    console.log('Evaluaciones encontradas para actualizar:', snapshot.size, 'para tipo:', scheduleData.type);
    
    let updated = 0;
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(evalDoc => {
      console.log('Actualizando evaluación:', evalDoc.id, evalDoc.data());
      batch.update(evalDoc.ref, {
        scheduledDate: Timestamp.fromDate(scheduleDate),
        scheduledTime: scheduleData.startTime,
        location: scheduleData.location || '',
        status: 'scheduled',
        updatedAt: Timestamp.fromDate(new Date()),
      });
      updated++;
    });
    
    if (updated > 0) {
      await batch.commit();
      console.log('Batch committed, actualizadas:', updated);
    }
    
    return updated;
  },

  // Get evaluations by type and scheduled date (for jornada view)
  async getEvaluationsByTypeAndDate(type: EvaluationType, date: Date): Promise<AdmissionEvaluation[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const evalsRef = collection(db, 'admissionEvaluations');
    const q = query(
      evalsRef,
      where('phaseType', '==', type),
      where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
      where('scheduledDate', '<=', Timestamp.fromDate(endOfDay))
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        gradeApplying: data.gradeApplying,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      } as AdmissionEvaluation & { gradeApplying?: string };
    });
  },

  // Bulk grade evaluations
  async bulkGradeEvaluations(entries: BulkGradeEntry[]): Promise<number> {
    const batch = writeBatch(db);
    const now = new Date();
    
    entries.forEach(entry => {
      const docRef = doc(db, 'admissionEvaluations', entry.evaluationId);
      batch.update(docRef, {
        result: entry.result,
        score: entry.score || null,
        observations: entry.observations || '',
        status: 'completed',
        completedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    });
    
    await batch.commit();
    return entries.length;
  },

  // Get all evaluations (for listing)
  async getAllEvaluations(): Promise<(AdmissionEvaluation & { gradeApplying?: string })[]> {
    const evalsRef = collection(db, 'admissionEvaluations');
    const snapshot = await getDocs(evalsRef);
    
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        admissionId: data.admissionId,
        studentName: data.studentName,
        phaseId: data.phaseId,
        phaseType: data.phaseType,
        phaseName: data.phaseName,
        status: data.status,
        gradeApplying: data.gradeApplying,
        scheduledDate: data.scheduledDate?.toDate?.() || data.scheduledDate,
        scheduledTime: data.scheduledTime,
        location: data.location,
        evaluatorId: data.evaluatorId,
        evaluatorName: data.evaluatorName,
        score: data.score,
        maxScore: data.maxScore,
        result: data.result,
        observations: data.observations,
        recommendations: data.recommendations,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt,
      } as AdmissionEvaluation & { gradeApplying?: string };
    });
  },

  // Limpiar evaluaciones duplicadas y entrevistas familiares de una admisión
  async cleanupEvaluations(admissionId: string): Promise<{ deleted: number; kept: string[] }> {
    const evalsRef = collection(db, 'admissionEvaluations');
    const q = query(evalsRef, where('admissionId', '==', admissionId));
    const snapshot = await getDocs(q);
    
    const getTimestampValue = (value: any): number => {
      const normalized = value?.toDate?.() || value;
      const date = normalized instanceof Date ? normalized : new Date(normalized || 0);
      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    };

    const getRichnessScore = (data: any): number => {
      const hasInterviewForm = data.psychologyInterviewForm && Object.values(data.psychologyInterviewForm).some((value) => {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return Boolean(value);
      });
      const interviewNotesCount = Array.isArray(data.interviewNotes) ? data.interviewNotes.length : 0;
      const subjectConfigCount = Array.isArray(data.subjectConfigs) ? data.subjectConfigs.length : 0;
      const recommendationCount = Array.isArray(data.recommendations)
        ? data.recommendations.length
        : (typeof data.recommendations === 'string' && data.recommendations.trim() ? 1 : 0);

      let score = 0;
      if (data.status === 'completed') score += 10;
      if (data.completedAt) score += 12;
      if (data.score !== undefined && data.score !== null) score += 8;
      if (typeof data.result === 'string' && data.result.trim()) score += 10;
      if (typeof data.interviewSummary === 'string' && data.interviewSummary.trim()) score += 35;
      if (typeof data.interviewRecommendation === 'string' && data.interviewRecommendation.trim()) score += 20;
      if (hasInterviewForm) score += 45;
      if (interviewNotesCount > 0) score += interviewNotesCount * 5;
      if (typeof data.observations === 'string' && data.observations.trim()) score += 8;
      if (recommendationCount > 0) score += Math.min(20, recommendationCount * 4);
      if (data.attendanceStatus && data.attendanceStatus !== 'pending') score += 12;
      if (typeof data.rescheduledCount === 'number' && data.rescheduledCount > 0) score += data.rescheduledCount * 3;
      if (data.manualAccessEnabled) score += 6;
      if (subjectConfigCount > 0) score += Math.min(15, subjectConfigCount * 2);
      if (typeof data.notes === 'string' && data.notes.trim()) score += 6;
      if (data.examEnabled) score += 2;

      return score;
    };

    const evaluationsByType: Record<string, { id: string; createdAt: number; updatedAt: number; richness: number }[]> = {};
    const toDelete: string[] = [];
    
    // Agrupar evaluaciones por tipo
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const type = data.phaseType;
      
      // Si es entrevista familiar, marcar para eliminar
      if (type === 'interview') {
        toDelete.push(docSnap.id);
        return;
      }
      
      if (!evaluationsByType[type]) {
        evaluationsByType[type] = [];
      }
      evaluationsByType[type].push({
        id: docSnap.id,
        createdAt: getTimestampValue(data.createdAt),
        updatedAt: getTimestampValue(data.updatedAt),
        richness: getRichnessScore(data),
      });
    });
    
    // Para cada tipo, conservar primero la evaluación con más información útil y usar la recencia solo como desempate.
    Object.entries(evaluationsByType).forEach(([_type, evals]) => {
      if (evals.length > 1) {
        evals.sort((a, b) => {
          if (b.richness !== a.richness) {
            return b.richness - a.richness;
          }

          if (b.updatedAt !== a.updatedAt) {
            return b.updatedAt - a.updatedAt;
          }

          return b.createdAt - a.createdAt;
        });

        for (let i = 1; i < evals.length; i++) {
          toDelete.push(evals[i].id);
        }
      }
    });
    
    // Eliminar las evaluaciones marcadas
    const batch = writeBatch(db);
    toDelete.forEach(id => {
      batch.delete(doc(db, 'admissionEvaluations', id));
    });
    
    if (toDelete.length > 0) {
      await batch.commit();
    }
    
    const kept = Object.keys(evaluationsByType);
    return { deleted: toDelete.length, kept };
  },

  // Limpiar TODAS las evaluaciones de entrevistas familiares y duplicados
  async cleanupAllEvaluations(): Promise<{ totalDeleted: number; admissionsProcessed: number }> {
    const evalsRef = collection(db, 'admissionEvaluations');
    const snapshot = await getDocs(evalsRef);
    
    // Agrupar por admissionId
    const byAdmission: Record<string, any[]> = {};
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const admId = data.admissionId;
      if (!byAdmission[admId]) byAdmission[admId] = [];
      byAdmission[admId].push({ id: docSnap.id, ...data });
    });
    
    let totalDeleted = 0;
    
    for (const admissionId of Object.keys(byAdmission)) {
      const result = await this.cleanupEvaluations(admissionId);
      totalDeleted += result.deleted;
    }
    
    return { totalDeleted, admissionsProcessed: Object.keys(byAdmission).length };
  }
};