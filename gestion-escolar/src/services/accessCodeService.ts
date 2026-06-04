// src/services/accessCodeService.ts
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  increment,
  arrayUnion,
  getDoc
} from 'firebase/firestore';

// Ajustamos la ruta para que suba un nivel y entre a firebase/config
import { db } from '../firebase/config'; 

// Ajustamos la ruta para traer la interfaz que creamos en el Paso 1
import type { AccessCode } from '../types';

export const accessCodeService = {
  // Get all codes
  async getAllCodes(): Promise<AccessCode[]> {
    try {
      const codesRef = collection(db, 'accessCodes');
      const snapshot = await getDocs(codesRef);
      
      const codes = snapshot.docs.map(doc => {
        const data = doc.data();
        // Procesar usedBy para convertir timestamps
        const usedBy = (data.usedBy || []).map((usage: any) => ({
          ...usage,
          usedAt: usage.usedAt?.toDate?.() || new Date(usage.usedAt) || new Date()
        }));
        
        return {
          id: doc.id,
          code: data.code || '',
          description: data.description || '',
          year: data.year || new Date().getFullYear(),
          maxUses: data.maxUses || 1,
          currentUses: data.currentUses || 0,
          isActive: data.isActive !== false,
          gradeLevel: data.gradeLevel || 'all',
          createdBy: data.createdBy || '',
          creatorName: data.creatorName || 'Admin',
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
          expiresAt: data.expiresAt?.toDate?.() || (data.expiresAt ? new Date(data.expiresAt) : undefined),
          usedBy: usedBy,
        } as AccessCode;
      });

      // Ordenar por fecha de creación (más reciente primero)
      return codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error en getAllCodes:', error);
      throw error;
    }
  },

  // Create new code
  async createCode(codeData: Omit<AccessCode, 'id'>): Promise<AccessCode> {
    const now = new Date();
    const dataToSave = {
      ...codeData,
      createdAt: Timestamp.fromDate(now),
      expiresAt: codeData.expiresAt ? Timestamp.fromDate(codeData.expiresAt as Date) : null,
      usedBy: [],
    };
    
    const docRef = await addDoc(collection(db, 'accessCodes'), dataToSave);
    return {
      ...codeData,
      id: docRef.id,
      createdAt: now,
      usedBy: [],
    } as AccessCode;
  },

  // Validate code for public form
  async validateCode(code: string, email?: string): Promise<{ valid: boolean; message: string; codeData?: AccessCode }> {
    const codesRef = collection(db, 'accessCodes');
    const q = query(codesRef, where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { valid: false, message: 'Código no encontrado' };
    }

    const docData = snapshot.docs[0];
    const data = docData.data();
    const codeData = {
      id: docData.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      expiresAt: data.expiresAt?.toDate?.() || undefined,
      usedBy: data.usedBy || [],
    } as AccessCode;

    // Check if active
    if (!codeData.isActive) {
      return { valid: false, message: 'Este código ha sido desactivado' };
    }

    // Check expiration
    if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
      return { valid: false, message: 'Este código ha expirado' };
    }

    // Check max uses
    if (codeData.currentUses >= codeData.maxUses) {
      return { valid: false, message: 'Este código ha alcanzado el límite máximo de usos' };
    }

    // Check if email already used this code
    if (email && codeData.usedBy && codeData.usedBy.length > 0) {
      const emailAlreadyUsed = codeData.usedBy.some(
        (usage: any) => usage.email?.toLowerCase() === email.toLowerCase()
      );
      if (emailAlreadyUsed) {
        return { valid: false, message: 'Este correo electrónico ya ha utilizado este código de acceso' };
      }
    }

    return { valid: true, message: 'Código válido', codeData };
  },

  // Check if email has already used any code
  async checkEmailUsed(email: string): Promise<{ used: boolean; code?: string }> {
    try {
      const codesRef = collection(db, 'accessCodes');
      const snapshot = await getDocs(codesRef);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const usedBy = data.usedBy || [];
        const found = usedBy.find((usage: any) => usage.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          return { used: true, code: data.code };
        }
      }
      return { used: false };
    } catch (error) {
      console.error('Error checking email:', error);
      return { used: false };
    }
  },

  // Use code - registra quién lo usó
  async useCode(codeId: string, userData: { name: string; grade: string; email: string; phone: string }): Promise<void> {
    try {
      const codeRef = doc(db, 'accessCodes', codeId);
      const codeDoc = await getDoc(codeRef);
      
      if (!codeDoc.exists()) {
        throw new Error('Código no encontrado');
      }

      const currentUses = codeDoc.data().currentUses || 0;
      const maxUses = codeDoc.data().maxUses || 1;

      await updateDoc(codeRef, {
        currentUses: currentUses + 1,
        isActive: (currentUses + 1) <= maxUses, // Mantener activo mientras no exceda el máximo
        usedBy: arrayUnion({
          name: userData.name,
          grade: userData.grade,
          email: userData.email,
          phone: userData.phone,
          usedAt: Timestamp.fromDate(new Date())
        })
      });
      console.log('Código usado correctamente');
    } catch (error) {
      console.error('Error using code:', error);
      throw error;
    }
  },

  // Increment code usage (legacy - ahora usar useCode)
  async incrementUsage(codeId: string): Promise<void> {
    const docRef = doc(db, 'accessCodes', codeId);
    await updateDoc(docRef, {
      currentUses: increment(1)
    });
  },

  // Toggle code status
  async toggleCodeStatus(id: string, isActive: boolean): Promise<void> {
    const docRef = doc(db, 'accessCodes', id);
    await updateDoc(docRef, { isActive });
  },

  // Delete code
  async deleteCode(id: string): Promise<void> {
    const docRef = doc(db, 'accessCodes', id);
    await deleteDoc(docRef);
  },

  // Get code by its value (for applicant portal)
  async getCodeByValue(code: string): Promise<AccessCode | null> {
    const codesRef = collection(db, 'accessCodes');
    const q = query(codesRef, where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      code: data.code || '',
      description: data.description || '',
      year: data.year || new Date().getFullYear(),
      maxUses: data.maxUses || 1,
      currentUses: data.currentUses || 0,
      isActive: data.isActive !== false,
      gradeLevel: data.gradeLevel || 'all',
      createdBy: data.createdBy || '',
      creatorName: data.creatorName || 'Admin',
      createdAt: data.createdAt?.toDate?.() || new Date(),
      expiresAt: data.expiresAt?.toDate?.() || undefined,
      usedBy: (data.usedBy || []).map((usage: any) => ({
        ...usage,
        usedAt: usage.usedAt?.toDate?.() || new Date()
      })),
    } as AccessCode;
  }
};