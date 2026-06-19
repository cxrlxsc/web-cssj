// src/pages/admin/Login.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import './adminStyles/AdminLogin.css'; 

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
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas. Verifique su correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="admin-login-container">
      
      {/* PANEL IZQUIERDO: Branding Institucional */}
      <div className="admin-login-brand">
        <div className="brand-content">
          <img src={logoImg} alt="Colegio Salesiano San José" className="brand-logo" />
          <h1 className="brand-title">Colegio Salesiano San José</h1>
          <p className="brand-subtitle">
            Sistema Integrado de Gestión Académica y Administrativa
          </p>
          <div className="brand-divider"></div>
          <p className="brand-footer">Santa Ana, El Salvador</p>
        </div>
      </div>

      {/* PANEL DERECHO: Formulario de Acceso */}
      <div className="admin-login-form-wrapper">
        <div className="admin-login-card">
          <div className="form-header">
            <h2>Acceso Restringido</h2>
            <p>Ingrese sus credenciales institucionales autorizadas para acceder al panel de control.</p>
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Correo Electrónico Institucional</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="usuario@salesianosanjose.edu.sv"
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Contraseña de Acceso</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className={cargando ? 'btn-submit loading' : 'btn-submit'}
            >
              {cargando ? 'Autenticando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <div className="form-footer">
            <p>El acceso a este sistema está estrictamente monitoreado. Todo intento de acceso no autorizado será registrado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}