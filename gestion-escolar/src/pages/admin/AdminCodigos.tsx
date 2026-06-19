// src/pages/admin/AdminCodigos.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accessCodeService } from '../../services/accessCodeService'; 
import logoImg from '../../assets/logo.png'; // Asegúrate de que esta ruta sea correcta
import './adminStyles/AdminCodigos.css';

export default function AdminCodigos() {
  const navigate = useNavigate();
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [generandoCodigo, setGenerandoCodigo] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminSession'); 
    navigate('/admin/login');
  };

  const handleGenerarCodigoPrueba = async () => {
    setGenerandoCodigo(true);
    try {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const nuevoCodigo = `CSSJ-${randomStr}`;

      await accessCodeService.createCode({
        code: nuevoCodigo,
        description: 'Código generado desde admin académico',
        year: 2026,
        maxUses: 1, 
        currentUses: 0,
        isActive: true,
        gradeLevel: 'all', 
        createdBy: 'admin_academico',
        creatorName: 'Administrador',
      } as any);

      setCodigoGenerado(nuevoCodigo);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al generar el código en Firebase.');
    } finally {
      setGenerandoCodigo(false);
    }
  };

  return (
    <div className="admin-codigos-layout">
      
      {/* NAVBAR VERDE OFICIAL AÑADIDA */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <img src={logoImg} alt="Logotipo Institucional" className="navbar-logo" />
          <span className="navbar-title">Colegio Salesiano San José</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
      </nav>

      <main className="codigos-main-wrapper">
        <div className="codigos-container">
          
          {/* HEADER MODERNO CON BOTÓN DE RETROCESO */}
          <header className="codigos-header">
            <div className="header-titles">
              <h1>Generador de Códigos</h1>
              <p>Gestión y emisión de pines de acceso para admisiones y procesos académicos.</p>
            </div>
            <Link to="/admin/recursos" className="btn-back">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Volver a Recursos Internos
            </Link>
          </header>

          {/* TARJETA PRINCIPAL DEL MÓDULO */}
          <section className="codigos-card">
            <div className="icon-wrapper-large-gold">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            
            <h2>Emisión Rápida</h2>
            <p>
              Utiliza este botón para generar un código de acceso válido para 1 solo uso, necesario para que los aspirantes ingresen al formulario de admisiones.
            </p>
            
            <button 
              className="btn-primary-gold"
              onClick={handleGenerarCodigoPrueba} 
              disabled={generandoCodigo}
            >
              {generandoCodigo ? 'Generando en Firebase...' : 'Generar Nuevo Código'}
            </button>

            {/* CAJA DE ÉXITO ANIMADA */}
            {codigoGenerado && (
              <div className="success-code-box">
                <span className="success-label">Código generado exitosamente</span>
                <span className="success-code">{codigoGenerado}</span>
                <p className="success-note">Este código ya está activo en Firebase y listo para usarse en el portal de admisiones.</p>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}