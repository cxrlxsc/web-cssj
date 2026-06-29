import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css'; 

import Home from '././pages/Home'; 
import About from './components/home/About';
import AccesoAdmision from './pages/admisiones/AccesoAdmision'; 
import ProcesoAdmision from './pages/admisiones/ProcesoAdmision';

// Importaciones para el sistema de Admin
import Login from './pages/admin/Login';
import AdminEvaluacionesList from './pages/admin/evaluaciones/AdminEvaluacionesList';
import AdminDashboard from './pages/admin/AdminDashboard'; 
import AdminInstitucional from './pages/admin/AdminInstitucional';
import AdminRecursosInternos from './pages/admin/AdminRecursosInternos'; 
import AdminAdmisiones from './pages/admin/AdminAdmisiones';
import { AdminPagosReingreso } from './pages/admin/AdminPagosReingreso';
import AdminCodigos from './pages/admin/AdminCodigos'; 
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import ContratoImpresion from './pages/shared/ContratoImpresion';
import AdminContrato from './pages/admin/AdminContrato';
import AdminContratosFirmados from './pages/admin/AdminContratosFirmados';
import ExamTemplateBuilder from './pages/admin/evaluaciones/ExamTemplateBuilder'; // <-- NUEVO: Importación del constructor de exámenes

// Páginas Públicas Adicionales
import Historia from './pages/home/Historia';
import Ubicacion from './pages/home/Ubicacion';
import Autoridades from './pages/home/Autoridades';
import MundoSalesiano from './pages/home/MundoSalesiano';
import ModeloEducativo from './pages/home/ModeloEducativo';
import Directorio from './pages/home/Directorio';
import Noticias from './pages/home/Noticias';
import ProcesoInscripcion from './pages/home/ProcesoInscripcion';
import CalendarioAcademico from './pages/home/CalendarioAcademico';

// Módulo de Reingreso Estudiantes
import PortalAspirante from './pages/admisiones/PortalAspirante';
import { LoginReingreso } from './pages/reingreso/LoginReingreso';
import { FormularioReingreso } from './pages/reingreso/FormularioReingreso';
import { PasosReingreso } from './pages/reingreso/PasosReingreso';
import { TalonarioPrint } from './pages/reingreso/TalonarioPrint';

function App() {
  
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 100, easing: 'ease-out-cubic' });
  }, []);

  return (
    <Routes>
      {/* PÁGINAS PÚBLICAS */}
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
      <Route
        path="/solicitud-admision/dashboard"
        element={<ProcesoAdmision />}
      />
      <Route path="/calendario-academico" element={<CalendarioAcademico />} />
      <Route path="/proceso-inscripcion" element={<ProcesoInscripcion />} />
      <Route path="/mi-solicitud" element={<PortalAspirante />} />

      {/* RUTAS DE REINGRESO (ANTIGUOS ALUMNOS) */}
      <Route path="/reingreso/login" element={<LoginReingreso />} />
      <Route path="/reingreso/formulario" element={<FormularioReingreso />} />
      <Route path="/reingreso/pasos" element={<PasosReingreso />} />
      <Route path="/reingreso/talonario" element={<TalonarioPrint />} />
      <Route path="/imprimir-contrato" element={<ContratoImpresion />} />

      {/* ============================================
          SISTEMA ADMINISTRATIVO (PROTEGIDO)
         ============================================ */}
      <Route path="/admin/login" element={<Login />} />

      {/* PORTAL CENTRAL DE SELECCIÓN */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* MODIFICAR PAGINA WEB (INSTITUCIONAL) */}
      <Route
        path="/admin/institucional"
        element={
          <ProtectedRoute>
            <AdminInstitucional />
          </ProtectedRoute>
        }
      />

      {/* RECURSOS INTERNOS ACADÉMICOS Y SUS 4 OPCIONES */}
      <Route
        path="/admin/recursos"
        element={
          <ProtectedRoute>
            <AdminRecursosInternos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/solicitudes"
        element={
          <ProtectedRoute>
            <AdminAdmisiones />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/colecturia"
        element={
          <ProtectedRoute>
            <AdminPagosReingreso />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/codigos"
        element={
          <ProtectedRoute>
            <AdminCodigos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contratos"
        element={
          <ProtectedRoute>
            <AdminContrato />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contratos-firmados"
        element={
          <ProtectedRoute>
            <AdminContratosFirmados />
          </ProtectedRoute>
        }
      />

      {/* CONSTRUCTOR DE EXÁMENES */}
      <Route
        path="/admin/evaluaciones/constructor"
        element={
          <ProtectedRoute>
            <ExamTemplateBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evaluaciones"
        element={
          <ProtectedRoute>
            <AdminEvaluacionesList />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;