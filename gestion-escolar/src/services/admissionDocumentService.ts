// src/services/admissionDocumentService.ts
import { 
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, query, where,
  orderBy, Timestamp
} from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

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
    description: 'Certificado de notas del último año cursado (opcional para Parvularia y 1° Grado)',
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
    description: 'Constancia de conducta del colegio anterior (obligatoria desde 2° Grado)',
    isRequired: false, // Se ajusta dinámicamente según el grado
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMB: 10
  }
];

// Helper function to determine which documents are required based on grade
export function getRequiredDocumentsForGrade(gradeApplying: string): RequiredDocument[] {
  const parvulariaAndFirstGrade = ['Kinder 4', 'Kinder 5', 'Preparatoria', '1° Grado'];
  const isParvulariaOrFirst = parvulariaAndFirstGrade.includes(gradeApplying);

  return REQUIRED_DOCUMENTS.map(doc => {
    // Constancia de conducta: opcional para parvularia y 1° grado, obligatoria para el resto
    if (doc.type === 'other') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst 
          ? 'Constancia de conducta del colegio anterior (opcional)' 
          : 'Constancia de conducta del colegio anterior (obligatoria)'
      };
    }
    
    // Notas anteriores: opcional para parvularia y 1° grado, obligatoria para el resto
    if (doc.type === 'previous_grades') {
      return {
        ...doc,
        isRequired: !isParvulariaOrFirst,
        description: isParvulariaOrFirst
          ? 'Certificado de notas del último año cursado (opcional)'
          : 'Certificado de notas del último año cursado (obligatorio)'
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
    
    // Upload to Firebase Storage. Some environments can return HTTP 412 for
    // object preconditions; retry once with an alternate object name.
    const timestamp = Date.now();
    const originalExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
    const safeExt = originalExt ? `.${originalExt}` : '';
    const baseFileName = `${type}_${timestamp}_${Math.random().toString(36).slice(2, 8)}${safeExt}`;

    const buildUploadErrorMessage = (error: unknown) => {
      if (typeof error === 'string') return error;
      const errorRecord = typeof error === 'object' && error !== null ? error as { code?: unknown; message?: unknown } : {};
      const code = String(errorRecord.code || '');
      const message = String(errorRecord.message || '');

      if (code === 'storage/unauthorized') {
        return 'No autorizado para subir archivos en este momento.';
      }
      if (code === 'storage/canceled') {
        return 'La subida del archivo fue cancelada.';
      }

      const details = [code, message].filter(Boolean).join(' | ');
      return details
        ? `Error de Storage: ${details}`
        : 'Error desconocido al subir archivo en Firebase Storage.';
    };

    // Upload using raw fetch() to bypass Firebase SDK issues and capture full error responses.
    const uploadWithFetch = async (objectName: string): Promise<{ fileUrl: string; objectName: string }> => {
      const bucket = 'sistema-adminacademica.firebasestorage.app';
      const objectPath = `admissions/${admissionId}/documents/${objectName}`;
      const encodedPath = encodeURIComponent(objectPath);
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedPath}`;

      // Get current user's auth token
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado. Inicia sesión de nuevo.');
      }
      const token = await user.getIdToken(true);

      const contentType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Firebase ${token}`,
          'Content-Type': contentType,
        },
        body: arrayBuffer,
      });

      if (!response.ok) {
        const responseBody = await response.text();
        console.error(`Storage upload failed [${response.status}]:`, responseBody);
        throw new Error(
          `Error de Storage HTTP ${response.status}: ${responseBody}`
        );
      }

      // Get download URL using SDK (this is a simple GET, not affected by upload issues)
      const storageRef = ref(storage, objectPath);
      const fileUrl = await getDownloadURL(storageRef);
      return { fileUrl, objectName };
    };

    let uploadResult;
    try {
      uploadResult = await uploadWithFetch(baseFileName);
    } catch (error: unknown) {
      throw new Error(buildUploadErrorMessage(error));
    }

    const fileUrl = uploadResult.fileUrl;

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