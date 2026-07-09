// src/components/layout/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { obtenerRol, puedeAcceder, candadoVigente, type RolAdmin } from '../../auth/adminAuth';
import { CandadoRecursos } from './CandadoRecursos';

interface Props {
  children: React.ReactNode;
  /** Rol mínimo requerido. Si se omite, basta con estar autenticado. */
  rol?: RolAdmin;
  /** Si es true, pide re-confirmar la contraseña antes de mostrar el contenido. */
  candado?: boolean;
}

export const ProtectedRoute = ({ children, rol: rolRequerido, candado }: Props) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [rolUsuario, setRolUsuario] = useState<RolAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  // Forzamos re-render cuando el candado se desbloquea desde el hijo.
  const [desbloqueado, setDesbloqueado] = useState(candadoVigente());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioActual) => {
      setUsuario(usuarioActual);
      if (usuarioActual?.email) {
        setRolUsuario(await obtenerRol(usuarioActual.email));
      } else {
        setRolUsuario(null);
      }
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', color: '#0068B3' }}>Cargando sistema de seguridad...</div>;
  }

  // Sin sesión → login
  if (!usuario) {
    return <Navigate to="/admin/login" />;
  }

  // Sesión pero sin permisos suficientes → de vuelta al panel central
  if (!puedeAcceder(rolUsuario, rolRequerido)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Área con candado que aún no ha sido desbloqueada en esta pestaña
  if (candado && !desbloqueado) {
    return <CandadoRecursos onDesbloquear={() => setDesbloqueado(true)} />;
  }

  return <>{children}</>;
};
