import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css'; 

import Home from './pages/Home'; 
import About from './components/home/About';
import AccesoAdmision from './pages/admisiones/AccesoAdmision'; 
import ProcesoAdmision from './pages/admisiones/ProcesoAdmision';

// Nuevas importaciones para el sistema de Admin
import Login from './pages/admin/Login';
import AdminInstitucional from './pages/admin/AdminInstitucional';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Historia from './pages/Historia';
import Ubicacion from './pages/Ubicacion';
import Autoridades from './pages/Autoridades';
import MundoSalesiano from './pages/MundoSalesiano';
import ModeloEducativo from './pages/ModeloEducativo';
import Directorio from './pages/Directorio';
import Noticias from './pages/Noticias';
import ProcesoInscripcion from './pages/ProcesoInscripcion';
import CalendarioAcademico from './pages/CalendarioAcademico';

function App() {
  
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 100, easing: 'ease-out-cubic' });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/nosotros" element={<About />} />
      <Route path="/historia" element={<Historia />} />
      <Route path="/ubicacion" element={<Ubicacion />} />
      <Route path="/autoridades" element={<Autoridades />} />
      <Route path="/mundo-salesiano" element={<MundoSalesiano />} />
      <Route path="/modelo-educativo" element={<ModeloEducativo />} />
      <Route path="/directorio-institucional" element={<Directorio />} />
      <Route path="/noticias" element={<Noticias />} />
      <Route path="/solicitud-admision" element={<AccesoAdmision />} />
      <Route path="/solicitud-admision/dashboard" element={<ProcesoAdmision />} />
      <Route path="/calendario-academico" element={<CalendarioAcademico />} />

      {/* RUTA PÚBLICA DEL LOGIN */}
      <Route path="/admin/login" element={<Login />} />
      {/*RUTA PARA PROCESO DE INSCRIPCION */}
      <Route path="/proceso-inscripcion" element={<ProcesoInscripcion />} />

      {/* RUTA PROTEGIDA DEL PANEL (Envuelves el panel con ProtectedRoute) */}
      <Route 
        path="/admin/institucional" 
        element={
          <ProtectedRoute>
            <AdminInstitucional />
          </ProtectedRoute>
        } 
      />

    </Routes>
  );
}

export default App;