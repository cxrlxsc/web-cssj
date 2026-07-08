// src/hooks/useAnioMatricula.ts
// Hook para mostrar el AÑO DE MATRÍCULA activo (configuracion/matricula) en la UI.
// Mientras carga, devuelve el año calendario actual para no dejar textos vacíos.
import { useEffect, useState } from 'react';
import { configService } from '../services/configService';

export function useAnioMatricula(): number {
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    let activo = true;
    configService.getAnioMatricula()
      .then(a => { if (activo) setAnio(a); })
      .catch(() => { /* se queda el año calendario */ });
    return () => { activo = false; };
  }, []);

  return anio;
}
