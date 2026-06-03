// src/pages/admin/Login.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Intenta iniciar sesión con Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // Si el login es correcto, lo enviamos al panel
      navigate('/admin/institucional');
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f9' }}>
      
      <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#002a4a', margin: '0 0 0.5rem 0' }}>Acceso Restringido</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Panel de Administración San José</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Correo Electrónico</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
            placeholder="admin@colegio.edu.sv"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          <label style={{ fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Contraseña</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          style={{ width: '100%', backgroundColor: '#008C5A', color: 'white', fontWeight: 'bold', padding: '1rem', border: 'none', borderRadius: '6px', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '1rem', transition: 'background-color 0.3s' }}
        >
          {cargando ? 'Iniciando sesión...' : 'Entrar al Panel'}
        </button>

      </form>
    </div>
  );
}