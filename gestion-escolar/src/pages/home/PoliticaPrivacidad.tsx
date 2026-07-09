// src/pages/home/PoliticaPrivacidad.tsx
// Página pública con la Política de Privacidad y Tratamiento de Datos.
// Reutiliza el mismo texto que la familia acepta en el portal de aspirantes.
import { useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PoliticaPrivacidadContenido from '../../components/admisiones/PoliticaPrivacidadContenido';

export default function PoliticaPrivacidad() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      {/* Encabezado */}
      <section style={{ background: '#008C5A', color: 'white', padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>
          Política de <span style={{ color: '#FAB529' }}>Privacidad</span>
        </h1>
        <p style={{ maxWidth: '620px', margin: '0.8rem auto 0', color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem' }}>
          Cómo el Colegio Salesiano San José protege y trata los datos personales del proceso de admisión.
        </p>
      </section>

      <main style={{ maxWidth: '820px', margin: '2.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px -12px rgba(2,42,74,0.18)', padding: '2rem 2.2rem' }}>
          <PoliticaPrivacidadContenido />
        </div>
      </main>

      <Footer />
    </div>
  );
}
