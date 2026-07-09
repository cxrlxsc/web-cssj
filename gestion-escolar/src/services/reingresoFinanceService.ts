// src/services/reingresoFinanceService.ts
// Pagos de matrícula REALES para alumnos de reingreso (antiguo ingreso).
// Como los alumnos de reingreso no viven en la colección 'admissions', se guardan
// en 'reingresoPayments' (id = carnet) para que aparezcan junto a los de nuevo ingreso.
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { AdmissionFileReview } from '../types';

export interface ReingresoPayment {
  carnet: string;
  studentName: string;
  grade: string;
  paymentReceipt: AdmissionFileReview;
  signedContract?: AdmissionFileReview;   // Contrato firmado subido por la familia
}

type Decision = 'approved' | 'rejected';

async function uploadFile(carnet: string, tipo: 'payment' | 'contract', file: File): Promise<string> {
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
  const objectName = `${tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const storageRef = ref(storage, `reingreso/${carnet}/${tipo}/${objectName}`);
  await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
  return getDownloadURL(storageRef);
}

function nuevoArchivo(fileUrl: string, fileName: string): AdmissionFileReview {
  return {
    fileUrl,
    fileName,
    status: 'pending',
    uploadedAt: new Date(),
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  };
}

export const reingresoFinanceService = {
  async uploadPaymentReceipt(carnet: string, studentName: string, grade: string, file: File): Promise<AdmissionFileReview> {
    const fileUrl = await uploadFile(carnet, 'payment', file);
    const receipt = nuevoArchivo(fileUrl, file.name);
    await setDoc(doc(db, 'reingresoPayments', carnet), { carnet, studentName, grade, paymentReceipt: receipt }, { merge: true });
    return receipt;
  },

  // Contrato firmado del alumno de reingreso (mismo flujo que el pago)
  async uploadSignedContract(carnet: string, studentName: string, grade: string, file: File): Promise<AdmissionFileReview> {
    const fileUrl = await uploadFile(carnet, 'contract', file);
    const contract = nuevoArchivo(fileUrl, file.name);
    await setDoc(doc(db, 'reingresoPayments', carnet), { carnet, studentName, grade, signedContract: contract }, { merge: true });
    return contract;
  },

  async reviewContract(carnet: string, decision: Decision, reviewedBy: string, reason?: string): Promise<void> {
    await updateDoc(doc(db, 'reingresoPayments', carnet), {
      'signedContract.status': decision,
      'signedContract.reviewedBy': reviewedBy,
      'signedContract.reviewedAt': Timestamp.fromDate(new Date()),
      'signedContract.rejectionReason': decision === 'rejected' ? (reason || 'Contrato con errores.') : null,
    });
  },

  async getPayment(carnet: string): Promise<ReingresoPayment | null> {
    const snap = await getDoc(doc(db, 'reingresoPayments', carnet));
    return snap.exists() ? (snap.data() as ReingresoPayment) : null;
  },

  async getAllPayments(): Promise<ReingresoPayment[]> {
    const snap = await getDocs(collection(db, 'reingresoPayments'));
    return snap.docs.map(d => d.data() as ReingresoPayment);
  },

  async reviewPayment(carnet: string, decision: Decision, reviewedBy: string, reason?: string): Promise<void> {
    await updateDoc(doc(db, 'reingresoPayments', carnet), {
      'paymentReceipt.status': decision,
      'paymentReceipt.reviewedBy': reviewedBy,
      'paymentReceipt.reviewedAt': Timestamp.fromDate(new Date()),
      'paymentReceipt.rejectionReason': decision === 'rejected' ? (reason || 'Comprobante no válido.') : null,
    });
  },
};
