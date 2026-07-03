// src/utils/imageCompression.ts
// Comprime imágenes en el navegador (canvas) antes de subirlas a Storage,
// para que las fotos de documentos no pesen demasiado.
// Los PDF y otros tipos no-imagen se devuelven sin cambios.

export interface CompressOptions {
  maxDimension?: number; // lado máximo en px (se mantiene la proporción)
  quality?: number;      // calidad JPEG 0..1
}

const DEFAULTS = { maxDimension: 1600, quality: 0.7 };

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  // Solo comprimimos imágenes rasterizadas (no PDF, no SVG).
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  const { maxDimension, quality } = { ...DEFAULTS, ...opts };

  try {
    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Fondo blanco por si la imagen tenía transparencia (PNG) al pasar a JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    // Si no logramos reducir el tamaño, dejamos el original.
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    // Ante cualquier fallo de compresión, subimos el original.
    return file;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
