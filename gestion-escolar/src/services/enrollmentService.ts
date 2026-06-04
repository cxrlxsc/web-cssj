// src/services/enrollmentService.ts
import { 
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, query, where,
  orderBy, Timestamp, runTransaction, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// 1. Ajustamos la ruta para que apunte a tu config
import { db, storage } from '../firebase/config';

// 2. Agregamos la palabra 'type' para Vite
import type { 
  EnrollmentData, 
  EnrollmentStatus,
  EnrollmentPayment,
  EnrollmentContract,
  GradeFees
} from '../types';

// ============================================
// El resto de tu código original empieza aquí:
// ============================================

// Configuración de costos por grado (puede moverse a Firestore)
const currentYear = new Date().getFullYear() + 1;
export const GRADE_FEES: GradeFees[] = [
  { gradeCode: 'K4', grade: 'Kinder 4', enrollmentFee: 150, monthlyFee: 95, materialsFee: 50, academicYear: currentYear },
  { gradeCode: 'K5', grade: 'Kinder 5', enrollmentFee: 150, monthlyFee: 95, materialsFee: 50, academicYear: currentYear },
  { gradeCode: 'PREP', grade: 'Preparatoria', enrollmentFee: 150, monthlyFee: 95, materialsFee: 50, academicYear: currentYear },
  { gradeCode: '1G', grade: '1° Grado', enrollmentFee: 175, monthlyFee: 110, materialsFee: 60, academicYear: currentYear },
  { gradeCode: '2G', grade: '2° Grado', enrollmentFee: 175, monthlyFee: 110, materialsFee: 60, academicYear: currentYear },
  { gradeCode: '3G', grade: '3° Grado', enrollmentFee: 175, monthlyFee: 110, materialsFee: 60, academicYear: currentYear },
  { gradeCode: '4G', grade: '4° Grado', enrollmentFee: 175, monthlyFee: 115, materialsFee: 65, academicYear: currentYear },
  { gradeCode: '5G', grade: '5° Grado', enrollmentFee: 175, monthlyFee: 115, materialsFee: 65, academicYear: currentYear },
  { gradeCode: '6G', grade: '6° Grado', enrollmentFee: 175, monthlyFee: 115, materialsFee: 65, academicYear: currentYear },
  { gradeCode: '7G', grade: '7° Grado', enrollmentFee: 200, monthlyFee: 125, materialsFee: 75, academicYear: currentYear },
  { gradeCode: '8G', grade: '8° Grado', enrollmentFee: 200, monthlyFee: 125, materialsFee: 75, academicYear: currentYear },
  { gradeCode: '9G', grade: '9° Grado', enrollmentFee: 200, monthlyFee: 125, materialsFee: 75, academicYear: currentYear },
  { gradeCode: '1B', grade: '1° Bachillerato', enrollmentFee: 225, monthlyFee: 145, materialsFee: 85, academicYear: currentYear },
  { gradeCode: '2B', grade: '2° Bachillerato', enrollmentFee: 225, monthlyFee: 145, materialsFee: 85, academicYear: currentYear },
];

// Conceptos de pago requeridos
export const PAYMENT_CONCEPTS = [
  { concept: 'matricula', name: 'Matrícula', required: true },
  { concept: 'primera_cuota', name: 'Primera Cuota (Enero)', required: true },
  { concept: 'materiales', name: 'Materiales Educativos', required: false },
];

export const enrollmentService = {
  // ============================================
  // ENROLLMENT MANAGEMENT
  // ============================================

  // Create enrollment for approved admission
  async createEnrollment(
    admissionId: string,
    studentName: string,
    gradeAssigned: string,
    academicYear: number
  ): Promise<EnrollmentData> {
    const now = new Date();
    
    // Get fees for grade
    const fees = GRADE_FEES.find(f => f.grade === gradeAssigned) || GRADE_FEES[0];
    
    // Create initial payments
    const payments: Omit<EnrollmentPayment, 'id'>[] = [
      {
        enrollmentId: '', // Will be set after creation
        concept: 'matricula',
        conceptName: 'Matrícula',
        amount: fees.enrollmentFee,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      },
      {
        enrollmentId: '',
        concept: 'primera_cuota',
        conceptName: 'Primera Cuota (Enero)',
        amount: fees.monthlyFee,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    ];

    if (fees.materialsFee) {
      payments.push({
        enrollmentId: '',
        concept: 'materiales',
        conceptName: 'Materiales Educativos',
        amount: fees.materialsFee,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const enrollmentData = {
      admissionId,
      studentName,
      gradeAssigned,
      academicYear,
      status: 'form_pending' as EnrollmentStatus,
      payments: [],
      totalAmount,
      amountPaid: 0,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await addDoc(collection(db, 'enrollments'), enrollmentData);
    const enrollmentId = docRef.id;

    // Usar writeBatch para que todos los pagos se creen atómicamente.
    const batch = writeBatch(db);
    const createdPayments: EnrollmentPayment[] = [];
    for (const payment of payments) {
      const paymentData = {
        ...payment,
        enrollmentId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };
      const paymentRef = doc(collection(db, 'enrollmentPayments'));
      batch.set(paymentRef, paymentData);
      createdPayments.push({
        id: paymentRef.id,
        ...payment,
        enrollmentId,
      });
    }
    await batch.commit();

    return {
      id: enrollmentId,
      ...enrollmentData,
      payments: createdPayments,
      createdAt: now,
      updatedAt: now,
    } as EnrollmentData;
  },

  // Get enrollment by admission ID
  async getEnrollmentByAdmission(admissionId: string): Promise<EnrollmentData | null> {
    const enrollmentsRef = collection(db, 'enrollments');
    const q = query(enrollmentsRef, where('admissionId', '==', admissionId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    // Get payments
    const payments = await this.getPaymentsForEnrollment(docSnap.id);
    
    // Get contract if exists
    const contract = await this.getContractForEnrollment(docSnap.id);

    return {
      id: docSnap.id,
      ...data,
      payments,
      contract: contract || undefined,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
    } as EnrollmentData;
  },

  // Get enrollment by ID
  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentData | null> {
    const docRef = doc(db, 'enrollments', enrollmentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    const payments = await this.getPaymentsForEnrollment(enrollmentId);
    const contract = await this.getContractForEnrollment(enrollmentId);

    return {
      id: docSnap.id,
      ...data,
      payments,
      contract: contract || undefined,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    } as EnrollmentData;
  },

  // Update enrollment status
  async updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): Promise<void> {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Save additional info
  async saveAdditionalInfo(enrollmentId: string, additionalInfo: EnrollmentData['additionalInfo']): Promise<void> {
    const docRef = doc(db, 'enrollments', enrollmentId);
    await updateDoc(docRef, {
      additionalInfo,
      status: 'form_submitted',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Get all enrollments (admin)
  async getAllEnrollments(academicYear?: number): Promise<EnrollmentData[]> {
    const enrollmentsRef = collection(db, 'enrollments');
    let q;
    
    if (academicYear) {
      q = query(enrollmentsRef, where('academicYear', '==', academicYear), orderBy('createdAt', 'desc'));
    } else {
      q = query(enrollmentsRef, orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);

    const enrollments: EnrollmentData[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const payments = await this.getPaymentsForEnrollment(docSnap.id);
      
      enrollments.push({
        id: docSnap.id,
        ...data,
        payments,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as EnrollmentData);
    }

    return enrollments;
  },

  // ============================================
  // PAYMENTS
  // ============================================

  // Get payments for enrollment
  async getPaymentsForEnrollment(enrollmentId: string): Promise<EnrollmentPayment[]> {
    const paymentsRef = collection(db, 'enrollmentPayments');
    const q = query(paymentsRef, where('enrollmentId', '==', enrollmentId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        paymentDate: data.paymentDate?.toDate?.() || data.paymentDate,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
      } as EnrollmentPayment;
    });
  },

  // Upload payment receipt
  async uploadPaymentReceipt(
    paymentId: string,
    enrollmentId: string,
    file: File,
    paymentMethod: EnrollmentPayment['paymentMethod'],
    paymentReference?: string,
    paymentDate?: Date
  ): Promise<void> {
    // Upload file
    const timestamp = Date.now();
    const fileName = `receipt_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `enrollments/${enrollmentId}/payments/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const receiptUrl = await getDownloadURL(storageRef);

    // Update payment
    const paymentRef = doc(db, 'enrollmentPayments', paymentId);
    await updateDoc(paymentRef, {
      receiptUrl,
      receiptFileName: file.name,
      paymentMethod,
      paymentReference: paymentReference || null,
      paymentDate: paymentDate ? Timestamp.fromDate(paymentDate) : Timestamp.fromDate(new Date()),
      status: 'uploaded',
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Check if all payments uploaded, update enrollment status
    await this.checkAndUpdateEnrollmentPaymentStatus(enrollmentId);
  },

  // Approve payment (admin)
  async approvePayment(paymentId: string, reviewedBy: string): Promise<void> {
    const paymentRef = doc(db, 'enrollmentPayments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    
    if (!paymentSnap.exists()) throw new Error('Pago no encontrado');
    
    const paymentData = paymentSnap.data();

    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) throw new Error('Monto de pago inválido');
    
    await updateDoc(paymentRef, {
      status: 'approved',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // Usar runTransaction para evitar condición de carrera en amountPaid.
    const enrollmentRef = doc(db, 'enrollments', paymentData.enrollmentId);
    await runTransaction(db, async (tx) => {
      const enrollSnap = await tx.get(enrollmentRef);
      if (!enrollSnap.exists()) return;
      const currentPaid = Number(enrollSnap.data().amountPaid) || 0;
      tx.update(enrollmentRef, {
        amountPaid: currentPaid + amount,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    });

    await this.checkAndUpdateEnrollmentPaymentStatus(paymentData.enrollmentId);
  },

  // Reject payment (admin)
  async rejectPayment(paymentId: string, reviewedBy: string, reason: string): Promise<void> {
    const paymentRef = doc(db, 'enrollmentPayments', paymentId);
    await updateDoc(paymentRef, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: reason,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Check and update enrollment status based on payments
  async checkAndUpdateEnrollmentPaymentStatus(enrollmentId: string): Promise<void> {
    const payments = await this.getPaymentsForEnrollment(enrollmentId);
    const allApproved = payments.every(p => p.status === 'approved');
    const anyUploaded = payments.some(p => p.status === 'uploaded' || p.status === 'reviewing');
    
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    
    if (allApproved) {
      await updateDoc(enrollmentRef, {
        status: 'contract_pending',
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } else if (anyUploaded) {
      await updateDoc(enrollmentRef, {
        status: 'payment_review',
        updatedAt: Timestamp.fromDate(new Date()),
      });
    }
  },

  // ============================================
  // CONTRACT
  // ============================================

  // Get contract for enrollment
  async getContractForEnrollment(enrollmentId: string): Promise<EnrollmentContract | null> {
    const contractsRef = collection(db, 'enrollmentContracts');
    const q = query(contractsRef, where('enrollmentId', '==', enrollmentId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      ...data,
      generatedAt: data.generatedAt?.toDate?.() || data.generatedAt,
      uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
      reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
    } as EnrollmentContract;
  },

  // Generate contract (creates record, PDF generation would be separate)
  async generateContract(
    enrollmentId: string,
    contractData: EnrollmentContract['contractData'],
    generatedBy: string
  ): Promise<EnrollmentContract> {
    const now = new Date();
    const year = new Date().getFullYear();
    
    // Generate unique contract number
    const contractNumber = `CSSJ-${year}-${enrollmentId.slice(-6).toUpperCase()}`;

    const contract = {
      enrollmentId,
      contractNumber,
      contractData,
      status: 'generated' as const,
      generatedAt: Timestamp.fromDate(now),
      generatedBy,
    };

    const docRef = await addDoc(collection(db, 'enrollmentContracts'), contract);

    // Update enrollment status
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'contract_generated',
      updatedAt: Timestamp.fromDate(now),
    });

    return {
      id: docRef.id,
      ...contract,
      generatedAt: now,
    } as EnrollmentContract;
  },

  // Upload signed contract
  async uploadSignedContract(
    contractId: string,
    enrollmentId: string,
    file: File
  ): Promise<void> {
    // Upload file
    const timestamp = Date.now();
    const fileName = `contract_signed_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `enrollments/${enrollmentId}/contract/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const signedUrl = await getDownloadURL(storageRef);

    // Update contract
    const contractRef = doc(db, 'enrollmentContracts', contractId);
    await updateDoc(contractRef, {
      signedUrl,
      signedFileName: file.name,
      uploadedAt: Timestamp.fromDate(new Date()),
      status: 'uploaded',
    });

    // Update enrollment status
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'contract_uploaded',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Approve contract (admin)
  async approveContract(contractId: string, enrollmentId: string, reviewedBy: string): Promise<void> {
    const contractRef = doc(db, 'enrollmentContracts', contractId);
    await updateDoc(contractRef, {
      status: 'approved',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: null,
    });

    // Update enrollment status to completed
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'completed',
      completedAt: Timestamp.fromDate(new Date()),
      completedBy: reviewedBy,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Reject contract (admin)
  async rejectContract(contractId: string, enrollmentId: string, reviewedBy: string, reason: string): Promise<void> {
    const contractRef = doc(db, 'enrollmentContracts', contractId);
    await updateDoc(contractRef, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: reason,
    });

    // Update enrollment status back to contract pending
    await updateDoc(doc(db, 'enrollments', enrollmentId), {
      status: 'contract_pending',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // ============================================
  // HELPERS
  // ============================================

  // Get fees for a grade
  getFeesForGrade(grade: string): GradeFees | undefined {
    return GRADE_FEES.find(f => f.grade === grade);
  },

  // Check if enrollment is complete
  async isEnrollmentComplete(enrollmentId: string): Promise<boolean> {
    const enrollment = await this.getEnrollmentById(enrollmentId);
    return enrollment?.status === 'completed';
  },

  // Get enrollment progress summary
  getProgressSteps(enrollment: EnrollmentData): { step: string; label: string; status: 'completed' | 'current' | 'pending' }[] {
    const steps = [
      { step: 'form', label: 'Formulario Adicional' },
      { step: 'payment', label: 'Pagos' },
      { step: 'contract', label: 'Contrato' },
      { step: 'complete', label: 'Completado' },
    ];

    const statusOrder: EnrollmentStatus[] = [
      'pending', 'form_pending', 'form_submitted',
      'payment_pending', 'payment_review', 'payment_approved',
      'contract_pending', 'contract_generated', 'contract_uploaded', 'contract_approved',
      'completed'
    ];

    const currentIndex = statusOrder.indexOf(enrollment.status);

    return steps.map((s, index) => {
      let stepStatus: 'completed' | 'current' | 'pending' = 'pending';
      
      if (index === 0) {
        if (currentIndex >= 2) stepStatus = 'completed';
        else if (currentIndex >= 0) stepStatus = 'current';
      } else if (index === 1) {
        if (currentIndex >= 5) stepStatus = 'completed';
        else if (currentIndex >= 3) stepStatus = 'current';
      } else if (index === 2) {
        if (currentIndex >= 9) stepStatus = 'completed';
        else if (currentIndex >= 6) stepStatus = 'current';
      } else {
        if (currentIndex >= 10) stepStatus = 'completed';
      }

      return { ...s, status: stepStatus };
    });
  }
};