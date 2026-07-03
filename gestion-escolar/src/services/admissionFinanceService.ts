// src/services/admissionFinanceService.ts
// Subida y revisión REALES del comprobante de pago y del contrato firmado.
// Los archivos van a Firebase Storage y el estado se guarda en el documento de la admisión.
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { AdmissionFileReview } from '../types';

type Decision = 'approved' | 'rejected';

async function uploadToStorage(admissionId: string, category: 'payment' | 'contract', file: File): Promise<string> {
  const ext = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';
  const objectName = `${category}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const objectPath = `admissions/${admissionId}/${category}/${objectName}`;
  const storageRef = ref(storage, objectPath);
  await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
  return getDownloadURL(storageRef);
}

export const admissionFinanceService = {
  // --- Comprobante de pago ---

  async uploadPaymentReceipt(admissionId: string, file: File): Promise<AdmissionFileReview> {
    const fileUrl = await uploadToStorage(admissionId, 'payment', file);
    const receipt: AdmissionFileReview = {
      fileUrl,
      fileName: file.name,
      status: 'pending',
      uploadedAt: new Date(),
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    };
    await updateDoc(doc(db, 'admissions', admissionId), { paymentReceipt: receipt });
    return receipt;
  },

  async reviewPayment(admissionId: string, decision: Decision, reviewedBy: string, reason?: string): Promise<void> {
    await updateDoc(doc(db, 'admissions', admissionId), {
      'paymentReceipt.status': decision,
      'paymentReceipt.reviewedBy': reviewedBy,
      'paymentReceipt.reviewedAt': Timestamp.fromDate(new Date()),
      'paymentReceipt.rejectionReason': decision === 'rejected' ? (reason || 'Comprobante no válido.') : null,
    });
  },

  // --- Contrato firmado ---

  async uploadSignedContract(admissionId: string, file: File): Promise<AdmissionFileReview> {
    const fileUrl = await uploadToStorage(admissionId, 'contract', file);
    const contract: AdmissionFileReview = {
      fileUrl,
      fileName: file.name,
      status: 'pending',
      uploadedAt: new Date(),
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    };
    await updateDoc(doc(db, 'admissions', admissionId), { signedContract: contract });
    return contract;
  },

  async reviewContract(admissionId: string, decision: Decision, reviewedBy: string, reason?: string): Promise<void> {
    const update: Record<string, unknown> = {
      'signedContract.status': decision,
      'signedContract.reviewedBy': reviewedBy,
      'signedContract.reviewedAt': Timestamp.fromDate(new Date()),
      'signedContract.rejectionReason': decision === 'rejected' ? (reason || 'Contrato con errores.') : null,
    };
    // Aprobar el contrato oficializa la matrícula.
    if (decision === 'approved') {
      update.status = 'enrolled';
    }
    await updateDoc(doc(db, 'admissions', admissionId), update);
  },
};
