// src/components/layout/CandadoRecursos.tsx
// Pantalla de re-autenticación que protege el área de Recursos Internos.
// Pide de nuevo la contraseña de la cuenta ya logueada antes de dar acceso.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { reautenticarParaRecursos, cerrarSesionAdmin } from '../../auth/adminAuth';
import logoImg from '../../assets/logo.png';

export const CandadoRecursos = ({ onDesbloquear }: { onDesbloquear: () => void }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  const correo = auth.currentUser?.email || '';

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificando(true);
    try {
      await reautenticarParaRecursos(password);
      onDesbloquear();
    } catch {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setVerificando(false);
    }
  };

  const handleSalir = async () => {
    await cerrarSesionAdmin();
    navigate('/admin/dashboard');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.candadoIcono}>
          <svg width="34" height="34" fill="none" stroke="#008C5A" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <img src={logoImg} alt="Colegio Salesiano San José" style={styles.logo} />
        <h2 style={styles.titulo}>Área Restringida</h2>
        <p style={styles.subtitulo}>
          Estás por entrar a <strong>Recursos Internos</strong>, que contiene datos sensibles.
          Confirma tu contraseña para continuar.
        </p>

        {correo && <div style={styles.correo}>{correo}</div>}

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleVerificar} style={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            placeholder="Contraseña de acceso"
            style={styles.input}
          />
          <button type="submit" disabled={verificando} style={{ ...styles.btnPrimario, opacity: verificando ? 0.7 : 1 }}>
            {verificando ? 'Verificando...' : 'Desbloquear Acceso'}
          </button>
        </form>

        <button onClick={handleSalir} style={styles.btnSecundario}>
          Volver al Panel Central
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #002a4a 0%, #008C5A 100%)',
    padding: '2rem',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '20px',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
    borderTop: '6px solid #FAB529',
  },
  candadoIcono: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    background: '#e6f5ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  logo: { height: '44px', width: 'auto', marginBottom: '0.75rem' },
  titulo: { margin: '0 0 0.5rem', color: '#030405', fontSize: '1.6rem', fontWeight: 800 },
  subtitulo: { margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 },
  correo: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '1rem',
    display: 'inline-block',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  input: {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    fontFamily: 'inherit',
    background: '#f8fafc',
    textAlign: 'center',
  },
  btnPrimario: {
    background: '#008C5A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '0.9rem',
    fontWeight: 800,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  btnSecundario: {
    background: 'transparent',
    color: '#64748b',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};
