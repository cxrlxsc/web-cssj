// src/hooks/useUserRole.ts
// Devuelve el rol de la cuenta actualmente logueada.
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { obtenerRol, type RolAdmin } from '../auth/adminAuth';

export function useUserRole(): { rol: RolAdmin | null; cargando: boolean } {
  const [rol, setRol] = useState<RolAdmin | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user?.email) {
        setRol(null);
        setCargando(false);
        return;
      }
      const r = await obtenerRol(user.email);
      setRol(r);
      setCargando(false);
    });
    return () => unsub();
  }, []);

  return { rol, cargando };
}
