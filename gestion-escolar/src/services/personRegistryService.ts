// src/services/personRegistryService.ts

// Servicio simplificado para que la admisión funcione sin el módulo completo de RRHH
export const personRegistryService = {
  async upsertPerson(data: any): Promise<string> {
    // Simulamos la creación de una persona y devolvemos un ID falso
    console.log("Registrando persona en el sistema institucional:", data);
    return `person_${Date.now()}`;
  }
};