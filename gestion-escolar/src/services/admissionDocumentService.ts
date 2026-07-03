// src/services/admissionDocumentService.ts
import { 
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, query, where,
  orderBy, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// 1. Ajuste de ruta: apuntamos a config.ts
import { db, storage } from '../firebase/config';

// 2. Ajuste de ruta: apuntamos a la carpeta types usando "type" para evitar errores
import type { 
  AdmissionDocument, 
  AdmissionDocumentType, 
  DocumentReviewStatus,
  RequiredDocument,
  AdmissionDocumentsStatus
} from '../types';

// Documentos requeridos para el proceso de admisión
// Configuración de todos los documentos posibles
export const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  {
    type: 'birth_certificate',
    name: 'Partida de Nacimiento',
    description: 'Partida de nacimiento original o certificada del estudiante',
    isRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'previous_grades',
    name: 'Notas del Año Anterior',
    description: 'Certificado de notas del último año cursado',
    isRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'financial_solvency',
    name: 'Solvencia Económica',
    description: 'Constancia de estar solvente con los pagos en el colegio de procedencia',
    isRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'grade_certificate',
    name: 'Certificado de Grado',
    description: 'Certificado que hace constar la promoción al grado solicitado',
    isRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'recent_photo',
    name: 'Foto Reciente',
    description: 'Fotografía reciente tamaño carné del estudiante',
    isRequired: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'identification',
    name: 'DUI del Responsable',
    description: 'Copia del DUI del padre, madre o tutor legal',
    isRequired: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  },
  {
    type: 'other',
    name: 'Constancia de Conducta',
    description: 'Constancia de conducta del colegio anterior',
    isRequired: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  }
];

// Helper function to determine which documents are required based on grade
export function getRequiredDocumentsForGrade(gradeApplying: string): RequiredDocument[] {
  const parvulariaAndFirstGrade = ['Kinder 4', 'Kinder 5', 'Preparatoria', '1° Grado'];
  const isParvulariaOrFirst = parvulariaAndFirstGrade.includes(gradeApplying);

  return REQUIRED_DOCUMENTS.map(doc => {
    if (doc.type === 'other') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst 
          ? 'Constancia de conducta del colegio anterior (opcional)' 
          : 'Constancia de conducta del colegio anterior (obligatoria)'
      };
    }
    
    if (doc.type === 'previous_grades') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst
          ? 'Certificado de notas del último año cursado (opcional)'
          : 'Certificado de notas del último año cursado (obligatorio)'
      };
    }

    if (doc.type === 'financial_solvency') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst
          ? 'Constancia de solvencia económica (opcional si es su primer colegio)'
          : 'Constancia de solvencia del colegio de procedencia (obligatoria)'
      };
    }

    if (doc.type === 'grade_certificate') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst
          ? 'Certificado de promoción (opcional)'
          : 'Certificado que avala la promoción al grado solicitado (obligatorio)'
      };
    }
    
    return doc;
  });
}

export const admissionDocumentService = {
  // ============================================
  // UPLOAD & MANAGE DOCUMENTS
  // ============================================

  // Upload a document for an admission
  async uploadDocument(
    admissionId: string,
    type: AdmissionDocumentType,
    file: File
  ): Promise<AdmissionDocument> {
    // Validate file
    const config = REQUIRED_DOCUMENTS.find(d => d.type === type);
    if (config) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!config.acceptedFormats.includes(ext)) {
        throw new Error(`Formato no permitido. Formatos aceptados: ${config.acceptedFormats.join(', ')}`);
      }
      if (file.size > config.maxSizeMB * 1024 * 1024) {
        throw new Error(`El archivo excede el tamaño máximo de ${config.maxSizeMB}MB`);
      }
    }

    // Check if there's an existing document of this type
    const existing = await this.getDocumentByType(admissionId, type);
    
    // Subida a Firebase Storage con el SDK (usa el bucket y la auth de la config
    // automáticamente). Reintenta una vez con otro nombre por si hay colisión (412).
    const originalExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
    const safeExt = originalExt ? `.${originalExt}` : '';
    const makeObjectName = () => `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`;

    const buildUploadErrorMessage = (error: unknown) => {
      if (typeof error === 'string') return error;
      const errorRecord = typeof error === 'object' && error !== null ? error as { code?: unknown; message?: unknown } : {};
      const code = String(errorRecord.code || '');
      const message = String(errorRecord.message || '');

      if (code === 'storage/unauthorized') {
        return 'No autorizado para subir archivos. Revisa las reglas de Storage.';
      }
      if (code === 'storage/canceled') {
        return 'La subida del archivo fue cancelada.';
      }

      const details = [code, message].filter(Boolean).join(' | ');
      return details
        ? `Error de Storage: ${details}`
        : 'Error desconocido al subir archivo en Firebase Storage.';
    };

    const uploadToStorage = async (objectName: string): Promise<string> => {
      const objectPath = `admissions/${admissionId}/documents/${objectName}`;
      const storageRef = ref(storage, objectPath);
      await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
      return getDownloadURL(storageRef);
    };

    let fileUrl: string;
    try {
      fileUrl = await uploadToStorage(makeObjectName());
    } catch {
      try {
        fileUrl = await uploadToStorage(makeObjectName());
      } catch (secondError) {
        throw new Error(buildUploadErrorMessage(secondError));
      }
    }

    const now = new Date();
    
    if (existing) {
      // Update existing document (new version)
      const previousVersions = existing.previousVersions || [];
      previousVersions.push({
        fileUrl: existing.fileUrl,
        uploadedAt: existing.uploadedAt,
        rejectionReason: existing.rejectionReason,
      });

      const docRef = doc(db, 'admissionDocuments', existing.id);
      await updateDoc(docRef, {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: 'resubmitted' as DocumentReviewStatus,
        version: existing.version + 1,
        previousVersions,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: Timestamp.fromDate(now),
      });

      return {
        ...existing,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: 'resubmitted',
        version: existing.version + 1,
        previousVersions,
        updatedAt: now,
      };
    } else {
      // Create new document
      const docData = {
        admissionId,
        type,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending' as DocumentReviewStatus,
        version: 1,
        previousVersions: [],
        uploadedAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, 'admissionDocuments'), docData);
      
      return {
        id: docRef.id,
        ...docData,
        uploadedAt: now,
        updatedAt: now,
      };
    }
  },

  // Get all documents for an admission
  async getDocumentsForAdmission(admissionId: string): Promise<AdmissionDocument[]> {
    const docsRef = collection(db, 'admissionDocuments');
    const q = query(
      docsRef,
      where('admissionId', '==', admissionId),
      orderBy('uploadedAt', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
      } as AdmissionDocument;
    });
  },

  // Get a specific document by type
  async getDocumentByType(admissionId: string, type: AdmissionDocumentType): Promise<AdmissionDocument | null> {
    const docsRef = collection(db, 'admissionDocuments');
    const q = query(
      docsRef,
      where('admissionId', '==', admissionId),
      where('type', '==', type)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
    } as AdmissionDocument;
  },

  // Get documents status for an admission
  async getDocumentsStatus(admissionId: string, gradeApplying?: string): Promise<AdmissionDocumentsStatus> {
    const documents = await this.getDocumentsForAdmission(admissionId);
    
    // Get required documents based on grade (if provided)
    const requiredDocs = gradeApplying 
      ? getRequiredDocumentsForGrade(gradeApplying)
      : REQUIRED_DOCUMENTS;
    
    const requiredTypes = requiredDocs.filter(d => d.isRequired).map(d => d.type);

    const approved = documents.filter(d => d.status === 'approved').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    const pending = documents.filter(d => d.status === 'pending' || d.status === 'resubmitted').length;

    // Check if all required documents are approved
    const approvedTypes = documents.filter(d => d.status === 'approved').map(d => d.type);
    const isComplete = requiredTypes.every(type => approvedTypes.includes(type));

    return {
      admissionId,
      totalRequired: requiredTypes.length,
      uploaded: documents.length,
      approved,
      rejected,
      pending,
      isComplete,
      documents,
    };
  },

  // ============================================
  // ADMIN REVIEW FUNCTIONS
  // ============================================

  // Approve a document
  async approveDocument(documentId: string, reviewedBy: string): Promise<void> {
    const docRef = doc(db, 'admissionDocuments', documentId);
    await updateDoc(docRef, {
      status: 'approved',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Reject a document with reason
  async rejectDocument(documentId: string, reviewedBy: string, reason: string): Promise<void> {
    const docRef = doc(db, 'admissionDocuments', documentId);
    await updateDoc(docRef, {
      status: 'rejected',
      reviewedBy,
      reviewedAt: Timestamp.fromDate(new Date()),
      rejectionReason: reason,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  // Get all pending documents for review (admin)
  async getPendingDocuments(): Promise<AdmissionDocument[]> {
    const docsRef = collection(db, 'admissionDocuments');
    const q = query(
      docsRef,
      where('status', 'in', ['pending', 'resubmitted']),
      orderBy('uploadedAt', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        reviewedAt: data.reviewedAt?.toDate?.() || data.reviewedAt,
      } as AdmissionDocument;
    });
  },

  // ============================================
  // HELPERS
  // ============================================

  // Get document type label in Spanish
  getDocumentTypeName(type: AdmissionDocumentType): string {
    const doc = REQUIRED_DOCUMENTS.find(d => d.type === type);
    return doc?.name || type;
  },

  // Get all required documents configuration
  getRequiredDocuments(gradeApplying?: string): RequiredDocument[] {
    return gradeApplying ? getRequiredDocumentsForGrade(gradeApplying) : REQUIRED_DOCUMENTS;
  },

  // Check if an admission has all required documents approved
  async isDocumentationComplete(admissionId: string): Promise<boolean> {
    const status = await this.getDocumentsStatus(admissionId);
    return status.isComplete;
  },

  // Delete a document (admin only)
  async deleteDocument(documentId: string): Promise<void> {
    const docRef = doc(db, 'admissionDocuments', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Delete from storage
      try {
        const storageRef = ref(storage, data.fileUrl);
        await deleteObject(storageRef);
      } catch (e) {
        console.warn('Could not delete file from storage:', e);
      }
    }
    
    // We don't actually delete, just mark as cancelled
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: 'Documento eliminado por administrador',
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
};