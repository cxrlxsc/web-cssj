import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { alumnoService } from '../../services/alumnoService';

export const LoginReingreso = () => {
  const [carnet, setCarnet] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validamos contra Firebase (colección 'alumnos', importada desde SQL Server)
      const alumno = await alumnoService.loginReingreso(carnet.trim(), pin);
      if (alumno) {
        // Guardamos el carnet en el navegador
        localStorage.setItem('studentSession', alumno.carnet);
        // Redirigimos a la nueva ruta de la carpeta reingreso
        navigate('/reingreso/formulario');
      } else {
        setError('Credenciales incorrectas. Verifica tu carnet y PIN (tu PIN inicial es tu NIE).');
      }
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: '#0068B3', textAlign: 'center', marginBottom: '0.5rem' }}>Portal de Reingreso</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>Ingresa para ratificar tu matrícula</p>

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' }}>Carnet del Estudiante</label>
            <input
              type="text"
              value={carnet}
              onChange={(e) => setCarnet(e.target.value)}
              placeholder="Ej: 20261507"
              required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' }}>PIN / Contraseña</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Ingresa tu PIN"
              required
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ background: loading ? '#cbd5e1' : '#FAB529', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'wait' : 'pointer', marginTop: '1rem' }}>
            {loading ? 'Verificando…' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
