// src/utils/imageValidation.ts

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateProfilePhoto = (file: File): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    // 1. Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return resolve({ 
        isValid: false, 
        error: 'El archivo debe ser una imagen válida (JPG o PNG).' 
      });
    }

    // 2. Validar tamaño máximo (ej. 5MB)
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return resolve({ 
        isValid: false, 
        error: `La imagen es muy pesada. No debe superar los ${maxSizeMB}MB.` 
      });
    }

    // 3. Validar dimensiones y proporciones usando un objeto Image de HTML5
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Limpiar memoria para no ralentizar el navegador

      const width = img.width;
      const height = img.height;

      // Validar resolución mínima para que no se vea pixelada en el carnet
      if (width < 300 || height < 300) {
        return resolve({ 
          isValid: false, 
          error: 'La imagen es muy pequeña. Debe tener al menos 300x300 píxeles de resolución.' 
        });
      }

      // Validar proporción (Aspect Ratio) - Una foto carné suele ser 3x4 o 1:1
      const ratio = height / width;
      
      // ratio < 0.8 significa que es apaisada (panorámica). ratio > 1.6 significa que es extremadamente alargada.
      if (ratio < 0.8 || ratio > 1.6) {
         return resolve({ 
           isValid: false, 
           error: 'La foto debe ser estilo retrato (vertical) o cuadrada. Evita fotos panorámicas.' 
         });
      }

      // Si pasa todas las pruebas, damos luz verde
      resolve({ isValid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ 
        isValid: false, 
        error: 'No se pudo leer la imagen. Intenta tomarla de nuevo o usar otro archivo.' 
      });
    };

    img.src = objectUrl;
  });
};