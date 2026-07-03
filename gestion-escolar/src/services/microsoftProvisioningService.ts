// src/services/microsoftProvisioningService.ts
// Cliente del backend (Cloud Function) que crea la cuenta real en Microsoft 365.
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export interface ProvisionResult {
  ok: boolean;
  microsoftUserId: string;
  userPrincipalName: string;
  teamsEnabled: boolean;
}

export const microsoftProvisioningService = {
  /**
   * Provisiona la cuenta de Microsoft 365 para una admisión ya aprobada.
   * El backend valida permisos, crea la cuenta vía Graph y actualiza la admisión.
   */
  async provisionAccount(admissionId: string): Promise<ProvisionResult> {
    const fn = httpsCallable<{ admissionId: string }, ProvisionResult>(
      functions,
      'provisionM365User'
    );
    const res = await fn({ admissionId });
    return res.data;
  },
};
