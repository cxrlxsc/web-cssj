import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  documentId,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Admission } from '../types';
import { personRegistryService } from './personRegistryService';
import { buildInstitutionalEmail, buildUniqueEmail, buildTempPassword } from '../utils/credentialsGenerator';

// Servicio base del expediente de admisión: guarda y actualiza la solicitud como tal.
// Los estados derivados del proceso y la coordinación con otras áreas viven en
// servicios complementarios como admissionWorkflowService e admissionInterconnectionService.

// Mapeo de grados a códigos de CARNET (tabla oficial del colegio).
// Formato del carnet: <añoMatrícula><códigoGrado><nºMatrícula>  ->  ej: 2026 + 11 + 01 = 20261101
const CARNET_GRADE_CODES: { [key: string]: string } = {
  'KINDER 4': '14', 'KINDER 5': '15', 'PREPARATORIA': '16',
  'PRIMER GRADO': '01', 'SEGUNDO GRADO': '02', 'TERCER GRADO': '03',
  'CUARTO GRADO': '04', 'QUINTO GRADO': '05', 'SEXTO GRADO': '06',
  'SEPTIMO GRADO': '07', 'OCTAVO GRADO': '08', 'NOVENO GRADO': '09',
  'PRIMER AÑO DE BACHILLERATO': '10', 'SEGUNDO AÑO DE BACHILLERATO': '11',
  'PRIMER AÑO TÉC. DIS. GRÁFICO': '31', 'SEGUNDO AÑO TÉC. DIS. GRÁFICO': '32', 'TERCER AÑO TÉC. DIS. GRÁFICO': '33',
  'PRIMER AÑO TÉC. SIS. ELÉCTRICOS': '41', 'SEGUNDO AÑO TÉC. SIS. ELÉCTRICOS': '42', 'TERCER AÑO TÉC. SIS. ELÉCTRICOS': '43',
  'PRIMER AÑO TÉC. DES. DE SOFTWARE': '51', 'SEGUNDO AÑO TÉC. DES. DE SOFTWARE': '52', 'TERCER AÑO TÉC. DES. DE SOFTWARE': '53',
};

// Etiquetas cortas tal como aparecen en la app (ej: "2° Bachillerato", "7° Grado", "Kinder 5")
const CARNET_GRADE_CODES_SHORT: { [key: string]: string } = {
  'kinder 4': '14', 'kinder 5': '15', 'preparatoria': '16',
  '1° grado': '01', '2° grado': '02', '3° grado': '03', '4° grado': '04', '5° grado': '05',
  '6° grado': '06', '7° grado': '07', '8° grado': '08', '9° grado': '09',
  '1° bachillerato': '10', '2° bachillerato': '11',
  '1° diseño gráfico': '31', '2° diseño gráfico': '32', '3° diseño gráfico': '33',
  '1° sistemas eléctricos': '41', '2° sistemas eléctricos': '42', '3° sistemas eléctricos': '43',
  '1° desarrollo de software': '51', '2° desarrollo de software': '52', '3° desarrollo de software': '53',
};

/** Código de grado de 2 dígitos para el carnet, tolerante a variaciones del nombre del grado. */
function getCarnetGradeCode(grado: string): string {
  const g = (grado || '').trim();
  if (CARNET_GRADE_CODES[g.toUpperCase()]) return CARNET_GRADE_CODES[g.toUpperCase()];

  const lower = g.toLowerCase();
  if (CARNET_GRADE_CODES_SHORT[lower]) return CARNET_GRADE_CODES_SHORT[lower];
  for (const [key, value] of Object.entries(CARNET_GRADE_CODES_SHORT)) {
    if (lower.includes(key)) return value;
  }

  // Fallback por número + palabra clave
  const num = parseInt((g.match(/\d+/) || ['0'])[0], 10);
  if (lower.includes('kinder')) return num === 4 ? '14' : num === 5 ? '15' : '16';
  if (lower.includes('preparatoria')) return '16';
  if (lower.includes('software')) return num >= 1 && num <= 3 ? `5${num}` : '51';
  if (lower.includes('eléctric') || lower.includes('electric')) return num >= 1 && num <= 3 ? `4${num}` : '41';
  if (lower.includes('gráfico') || lower.includes('grafico') || lower.includes('diseño') || lower.includes('diseno')) return num >= 1 && num <= 3 ? `3${num}` : '31';
  if (lower.includes('bachillerato')) return num === 2 ? '11' : '10';
  if (lower.includes('grado') && num >= 1 && num <= 9) return num.toString().padStart(2, '0');
  return '00';
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }

  if (value instanceof Date || value instanceof Timestamp) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => stripUndefinedDeep(item))
      .filter(item => item !== undefined) as T;
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, nestedValue]) => [key, stripUndefinedDeep(nestedValue)])
        .filter(([, nestedValue]) => nestedValue !== undefined)
    ) as T;
  }

  return value;
}

function normalizeEmail(email?: string): string {
  return email?.trim().toLowerCase() || '';
}

function normalizeIdentityText(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeAdmissionDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

function buildDateKey(date: Date, mode: 'local' | 'utc'): string {
  const year = mode === 'utc' ? date.getUTCFullYear() : date.getFullYear();
  const month = (mode === 'utc' ? date.getUTCMonth() : date.getMonth()) + 1;
  const day = mode === 'utc' ? date.getUTCDate() : date.getDate();

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getComparableDateKeys(date: Date): string[] {
  return Array.from(new Set([
    buildDateKey(date, 'local'),
    buildDateKey(date, 'utc'),
  ]));
}

function birthDatesMatch(left: Date, right: Date): boolean {
  const rightKeys = new Set(getComparableDateKeys(right));
  return getComparableDateKeys(left).some(key => rightKeys.has(key));
}

function getBirthDateSearchWindow(date: Date): { start: Date; end: Date } {
  const normalized = normalizeAdmissionDate(date);

  return {
    start: new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate() - 1, 0, 0, 0, 0),
    end: new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate() + 2, 0, 0, 0, 0),
  };
}

function mapAdmissionRecord(id: string, data: Record<string, unknown>): Admission {
  return {
    id,
    ...data,
    applicationDate: (data.applicationDate as { toDate?: () => Date } | undefined)?.toDate?.() || data.applicationDate,
    dateOfBirth: (data.dateOfBirth as { toDate?: () => Date } | undefined)?.toDate?.() || data.dateOfBirth,
    reviewedAt: (data.reviewedAt as { toDate?: () => Date } | undefined)?.toDate?.() || data.reviewedAt,
  } as Admission;
}

function sortAdmissionsByApplicationDateDesc(admissions: Admission[]): Admission[] {
  return admissions
    .slice()
    .sort((left, right) => {
      const leftTime = left.applicationDate instanceof Date ? left.applicationDate.getTime() : 0;
      const rightTime = right.applicationDate instanceof Date ? right.applicationDate.getTime() : 0;
      return rightTime - leftTime;
    });
}

function isSameApplicant(existing: Admission, incoming: Omit<Admission, 'id'>): boolean {
  if (!(existing.dateOfBirth instanceof Date) || !(incoming.dateOfBirth instanceof Date)) {
    return false;
  }

  const sameFirstName = normalizeIdentityText(existing.studentFirstName) === normalizeIdentityText(incoming.studentFirstName);
  const sameLastName = normalizeIdentityText(existing.studentLastName) === normalizeIdentityText(incoming.studentLastName);
  const sameGender = !existing.gender || !incoming.gender || existing.gender === incoming.gender;
  const sameCycle = !existing.enrollmentYear || !incoming.enrollmentYear || existing.enrollmentYear === incoming.enrollmentYear;

  return sameFirstName && sameLastName && sameGender && sameCycle && birthDatesMatch(existing.dateOfBirth, incoming.dateOfBirth);
}

export const admissionService = {
  // Get all admissions
  async getAllAdmissions(): Promise<Admission[]> {
    const admissionsRef = collection(db, 'admissions');
    const q = query(admissionsRef, orderBy('applicationDate', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => mapAdmissionRecord(doc.id, doc.data()));
  },

  async getAdmissionsByParentEmail(email: string): Promise<Admission[]> {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return [];
    }

    const admissionsRef = collection(db, 'admissions');
    const q = query(admissionsRef, where('parentEmail', '==', normalizedEmail));
    const snapshot = await getDocs(q);

    return sortAdmissionsByApplicationDateDesc(
      snapshot.docs.map(doc => mapAdmissionRecord(doc.id, doc.data()))
    );
  },

  async checkAdmissionConflicts(
    admissionData: Omit<Admission, 'id'>
  ): Promise<{ duplicateAdmission?: Admission; familyAdmissions: Admission[] }> {
    const normalizedDateOfBirth = normalizeAdmissionDate(admissionData.dateOfBirth as Date);
    const birthDateWindow = getBirthDateSearchWindow(normalizedDateOfBirth);
    const admissionsRef = collection(db, 'admissions');
    const sameDateQuery = query(
      admissionsRef,
      where('dateOfBirth', '>=', Timestamp.fromDate(birthDateWindow.start)),
      where('dateOfBirth', '<', Timestamp.fromDate(birthDateWindow.end))
    );

    const [familyAdmissions, sameDateSnapshot] = await Promise.all([
      this.getAdmissionsByParentEmail(admissionData.parentEmail),
      getDocs(sameDateQuery),
    ]);

    const duplicateAdmission = sameDateSnapshot.docs
      .map(doc => mapAdmissionRecord(doc.id, doc.data()))
      .find(existingAdmission => isSameApplicant(existingAdmission, {
        ...admissionData,
        dateOfBirth: normalizedDateOfBirth,
      }));

    return {
      duplicateAdmission,
      familyAdmissions: duplicateAdmission
        ? familyAdmissions.filter(admission => admission.id !== duplicateAdmission.id)
        : familyAdmissions,
    };
  },

  // Check if email already has an admission
  async checkExistingAdmission(email: string): Promise<{ exists: boolean; admission?: Admission }> {
    try {
      const admissions = await this.getAdmissionsByParentEmail(email);

      if (admissions.length > 0) {
        return {
          exists: true,
          admission: admissions[0],
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking existing admission:', error);
      return { exists: false };
    }
  },

  // Create new admission
  async createAdmission(admissionData: Omit<Admission, 'id'>): Promise<string> {
    const normalizedParentEmail = normalizeEmail(admissionData.parentEmail);
    const normalizedDateOfBirth = normalizeAdmissionDate(admissionData.dateOfBirth as Date);
    const conflicts = await this.checkAdmissionConflicts({
      ...admissionData,
      parentEmail: normalizedParentEmail,
      dateOfBirth: normalizedDateOfBirth,
    });

    if (conflicts.duplicateAdmission) {
      throw new Error('Ya existe una solicitud de admisión registrada para este estudiante. Verifique si está duplicando al mismo aspirante.');
    }

    const institutionalPersonId = await personRegistryService.upsertPerson({
      id: admissionData.institutionalPersonId,
      fullName: `${admissionData.studentFirstName} ${admissionData.studentLastName}`.trim(),
      email: normalizedParentEmail,
      phone: admissionData.parentPhone,
      addTypes: ['candidate'],
    });

    const dataToSave: Record<string, unknown> = {
      ...admissionData,
      institutionalPersonId,
      parentEmail: normalizedParentEmail,
      applicationDate: Timestamp.fromDate(new Date()),
      dateOfBirth: Timestamp.fromDate(normalizedDateOfBirth),
    };
    
    // Firestore rechaza valores undefined – eliminarlos antes de guardar
    const cleanData = Object.fromEntries(Object.entries(dataToSave).filter(([, v]) => v !== undefined));
    
    const docRef = await addDoc(collection(db, 'admissions'), cleanData);
    return docRef.id;
  },

  // Update admission status
  async updateAdmissionStatus(
    id: string, 
    status: Admission['status'],
    reviewedBy?: string,
    reviewNotes?: string
  ): Promise<void> {
    const docRef = doc(db, 'admissions', id);
    const updateData: any = { status };
    
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = Timestamp.fromDate(new Date());
    }
    
    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }
    
    await updateDoc(docRef, updateData);
  },

  // Update admission
  async updateAdmission(id: string, data: Partial<Admission>): Promise<void> {
    const docRef = doc(db, 'admissions', id);
    await updateDoc(docRef, stripUndefinedDeep(data));
  },

  // Get admissions by access code
  async getAdmissionsByAccessCode(code: string): Promise<Admission[]> {
    const admissionsRef = collection(db, 'admissions');
    const q = query(admissionsRef, where('accessCodeUsed', '==', code));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => mapAdmissionRecord(doc.id, doc.data()));
  },

  // Get admission by ID
  async getAdmissionById(id: string): Promise<Admission | null> {
    const admissionsRef = collection(db, 'admissions');
    const snapshot = await getDocs(admissionsRef);
    
    const docSnap = snapshot.docs.find(d => d.id === id);
    if (!docSnap) return null;

    return mapAdmissionRecord(docSnap.id, docSnap.data());
  },

  // Delete admission
  async deleteAdmission(id: string): Promise<void> {
    const docRef = doc(db, 'admissions', id);
    await deleteDoc(docRef);
  },

  // Generar número de carnet.
  // Formato: <añoMatrícula><códigoGrado><correlativo>  ->  ej: 2026 + 11 + 01 = 20261101
  async generateStudentCarnet(gradeApplying: string, enrollmentYear?: number): Promise<string> {
    const añoMatricula = enrollmentYear || new Date().getFullYear();
    const gradeCode = getCarnetGradeCode(gradeApplying);
    const prefix = `${añoMatricula}${gradeCode}`;

    // Correlativo: carnets ya existentes con el mismo prefijo (año + grado),
    // tanto de admisiones aprobadas como de alumnos de ANTIGUO INGRESO migrados
    // desde SQL (colección 'alumnos', donde el ID del documento es el carnet).
    const admissionsRef = collection(db, 'admissions');
    const q = query(
      admissionsRef,
      where('status', '==', 'approved'),
      where('gradeApplying', '==', gradeApplying)
    );
    const snapshot = await getDocs(q);
    const usados = snapshot.docs
      .map(doc => {
        const data = doc.data() as any;
        return (data.carnet || data.assignedCredentials?.studentCode || '') as string;
      })
      .filter(carnet => carnet.startsWith(prefix));

    const alumnosSnap = await getDocs(query(
      collection(db, 'alumnos'),
      where(documentId(), '>=', prefix + '00'),
      where(documentId(), '<=', prefix + '99')
    ));
    usados.push(...alumnosSnap.docs.map(d => d.id));

    // Siguiente correlativo = mayor correlativo usado + 1 (tolera huecos y duplicados)
    const maxCorrelativo = usados.reduce((max, carnet) => {
      const n = parseInt(carnet.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    const orderCode = (maxCorrelativo + 1).toString().padStart(2, '0');
    return `${prefix}${orderCode}`;
  },

  // Obtener todos los carnets del año y grado específico
  async getStudentsByGradeAndYear(gradeApplying: string, year: number): Promise<Admission[]> {
    const admissionsRef = collection(db, 'admissions');
    const q = query(
      admissionsRef,
      where('status', '==', 'approved'),
      where('gradeApplying', '==', gradeApplying)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Admission))
      .filter(admission => {
        const decidedAt = admission.finalDecision?.decidedAt;
        if (decidedAt) {
          const date = decidedAt instanceof Date ? decidedAt : new Date(decidedAt as any);
          return date.getFullYear() === year;
        }
        return false;
      });
  },

  // ============================================
  // APROBACIÓN FINAL Y MATRÍCULA
  // ============================================

  /**
   * Aprueba a un aspirante para matrícula y genera sus credenciales institucionales.
   * Genera: carnet (AÑOGRADOORDEN), correo (nombre.apellidoAÑO@dominio) y contraseña (Csj<carnet>!).
   * Persiste status='approved', el carnet y assignedCredentials en la admisión.
   *
   * NOTA: esto NO crea la cuenta real en Microsoft 365 (eso es la Fase 2, vía backend/Graph).
   * Deja provisioningStatus='not_started' para que el paso de provisión se haga aparte.
   */
  async approveForEnrollment(
    admission: Admission,
    adminName: string
  ): Promise<{ carnet: string; email: string; password: string }> {
    if (admission.status === 'approved' || admission.status === 'enrolled') {
      throw new Error('Este aspirante ya fue aprobado anteriormente.');
    }

    // 1. Año de matrícula (usa el del código de acceso o el año actual). Se usa en carnet y correo.
    const añoMatricula = admission.enrollmentYear || new Date().getFullYear();

    // 2. Generar carnet institucional (8 dígitos): añoMatricula + códigoGrado + correlativo
    const carnet = await this.generateStudentCarnet(admission.gradeApplying, añoMatricula);

    // 3. Correo institucional único (evita colisiones con correos ya asignados)
    const all = await this.getAllAdmissions();
    const existingEmails = all
      .map(a => a.assignedCredentials?.microsoftEmail)
      .filter((e): e is string => !!e);
    const baseEmail = buildInstitutionalEmail(
      admission.studentFirstName,
      admission.studentLastName,
      añoMatricula
    );
    const email = buildUniqueEmail(baseEmail, existingEmails);

    // 4. Contraseña inicial temporal derivada del carnet
    const password = buildTempPassword(carnet);

    // 5. Persistir en la admisión
    const now = new Date();
    await this.updateAdmission(admission.id, {
      status: 'approved',
      carnet,
      reviewedBy: adminName,
      reviewedAt: now,
      finalDecision: {
        result: 'approved',
        decidedBy: adminName,
        decidedByName: adminName,
        decidedAt: now,
      },
      assignedCredentials: {
        microsoftEmail: email,
        microsoftPassword: password,
        studentCode: carnet,
        assignedBy: adminName,
        assignedByName: adminName,
        assignedAt: now,
        teamsEnabled: false,
        welcomeEmailSent: false,
        provisioningStatus: 'not_started',
      },
    });

    return { carnet, email, password };
  }
};
