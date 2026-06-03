// src/components/layout/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase/config';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Escucha activamente si hay un usuario logueado en Firebase
    const unsubscribe = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', color: '#0068B3' }}>Cargando sistema de seguridad...</div>;
  }

  // Si no hay usuario, lo regresamos a la pantalla de login
  if (!usuario) {
    return <Navigate to="/admin/login" />;
  }

  // Si hay usuario, lo dejamos pasar al componente (el panel)
  return <>{children}</>;
};