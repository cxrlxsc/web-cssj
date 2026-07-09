// src/hooks/usePortada.ts
// Permite personalizar el fondo (color y/o imagen) de las franjas superiores
// de las páginas públicas desde el Gestor de Página Web (admin/institucional).
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PortadaConfig {
  color?: string;
  imagen?: string;
}

export const COLOR_PORTADA_DEFAULT = '#008C5A';

// Caché compartida: una sola lectura a Firestore por visita, sin importar
// cuántas páginas navegue el usuario.
let portadasCache: Record<string, PortadaConfig> | null = null;
let portadasPromise: Promise<Record<string, PortadaConfig>> | null = null;

export function obtenerPortadas(): Promise<Record<string, PortadaConfig>> {
  if (portadasCache) return Promise.resolve(portadasCache);
  if (!portadasPromise) {
    portadasPromise = getDoc(doc(db, 'institucional', 'portadas'))
      .then((snap) => {
        portadasCache = snap.exists() ? (snap.data() as Record<string, PortadaConfig>) : {};
        return portadasCache;
      })
      .catch(() => {
        portadasPromise = null; // permite reintentar si falló la red
        return {} as Record<string, PortadaConfig>;
      });
  }
  return portadasPromise;
}

function hexARgba(hex: string, alpha: number): string {
  const limpio = hex.replace('#', '');
  const completo = limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio;
  const num = parseInt(completo, 16);
  if (isNaN(num) || completo.length !== 6) return `rgba(0, 140, 90, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// Construye el estilo de fondo de una portada a partir de su configuración.
// Se exporta también para reutilizarlo en la vista previa del admin.
export function estiloPortada(config?: PortadaConfig): CSSProperties {
  if (!config) return {};

  if (config.imagen) {
    const color = config.color || COLOR_PORTADA_DEFAULT;
    return {
      backgroundColor: color,
      // Velo del color institucional sobre la foto para que el texto siga legible
      backgroundImage: `linear-gradient(${hexARgba(color, 0.88)}, ${hexARgba(color, 0.72)}), url("${config.imagen}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'scroll',
    };
  }

  if (config.color) {
    return {
      backgroundColor: config.color,
      // Conserva el patrón de puntos característico del sitio
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 2px, transparent 2px)',
      backgroundSize: '30px 30px',
      backgroundAttachment: 'scroll',
    };
  }

  return {};
}

// Hook para las páginas públicas: devuelve el estilo a aplicar sobre la
// sección hero. Si no hay nada configurado devuelve {} y manda el CSS original.
export function usePortada(pageId: string): CSSProperties {
  const [config, setConfig] = useState<PortadaConfig | undefined>(portadasCache?.[pageId]);

  useEffect(() => {
    let activo = true;
    obtenerPortadas().then((portadas) => {
      if (activo) setConfig(portadas[pageId]);
    });
    return () => { activo = false; };
  }, [pageId]);

  return estiloPortada(config);
}
