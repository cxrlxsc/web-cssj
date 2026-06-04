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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Admission } from '../types';
import { personRegistryService } from './personRegistryService';

// Servicio base del expediente de admisión: guarda y actualiza la solicitud como tal.
// Los estados derivados del proceso y la coordinación con otras áreas viven en
// servicios complementarios como admissionWorkflowService e admissionInterconnectionService.

// Mapeo de grados a códigos numéricos
const gradeToCode: { [key: string]: string } = {
  'kinder': '00',
  'preparatoria': '01',
  '1': '01',
  '2': '02',
  '3': '03',
  '4': '04',
  '5': '05',
  '6': '06',
  '7': '07',
  '8': '08',
  '9': '09',
  '1-bachillerato': '10',
  '2-bachillerato': '11',
  'primero-bachillerato': '10',
  'segundo-bachillerato': '11',
};

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

  // Generar número de carnet
  // Formato: AÑOGRADOORDEN (ej: 20250103 = año 2025, grado 01, orden 03)
  async generateStudentCarnet(gradeApplying: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    // Obtener código del grado
    const gradeCode = gradeToCode[gradeApplying.toLowerCase()] || '00';
    
    // Contar cuántos estudiantes aprobados hay para este grado este año
    const admissionsRef = collection(db, 'admissions');
    const q = query(
      admissionsRef, 
      where('status', '==', 'approved'),
      where('gradeApplying', '==', gradeApplying)
    );
    const snapshot = await getDocs(q);
    
    // Filtrar por año de aprobación
    const approvedThisYear = snapshot.docs.filter(doc => {
      const data = doc.data();
      const decidedAt = data.finalDecision?.decidedAt;
      if (decidedAt) {
        const date = decidedAt.toDate ? decidedAt.toDate() : new Date(decidedAt);
        return date.getFullYear() === currentYear;
      }
      return false;
    });
    
    // El orden será el siguiente número
    const orderNumber = approvedThisYear.length + 1;
    const orderCode = orderNumber.toString().padStart(2, '0');
    
    // Formato final: AÑOGRADOORDEN
    return `${currentYear}${gradeCode}${orderCode}`;
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
  }
};
