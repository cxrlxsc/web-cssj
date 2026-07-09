import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css'; 

import Home from '././pages/Home'; 
import About from './components/home/About';
import AccesoAdmision from './pages/admisiones/AccesoAdmision'; 

// Importaciones para el sistema de Admin
import Login from './pages/admin/Login';
import AdminEvaluacionesList from './pages/admin/evaluaciones/AdminEvaluacionesList';
import AdminDashboard from './pages/admin/AdminDashboard'; 
import AdminInstitucional from './pages/admin/AdminInstitucional';
import AdminRecursosInternos from './pages/admin/AdminRecursosInternos'; 
import AdminAdmisiones from './pages/admin/AdminAdmisiones';
import AdminAprobacionMatricula from './pages/admin/AdminAprobacionMatricula';
import { AdminPagosReingreso } from './pages/admin/AdminPagosReingreso';
import AdminCodigos from './pages/admin/AdminCodigos'; 
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import ContratoImpresion from './pages/shared/ContratoImpresion';
import AdminContrato from './pages/admin/AdminContrato';
import AdminContratosFirmados from './pages/admin/AdminContratosFirmados';
import AdminImportarAlumnos from './pages/admin/AdminImportarAlumnos';
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
import PoliticaPrivacidad from './pages/home/PoliticaPrivacidad';

// Módulo de Reingreso Estudiantes
import PortalAspirante from './pages/admisiones/PortalAspirante';
import ExamenAspirante from './pages/admisiones/ExamenAspirante';
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
      <Route path="/calendario-academico" element={<CalendarioAcademico />} />
      <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
      <Route path="/proceso-inscripcion" element={<ProcesoInscripcion />} />
      <Route path="/mi-solicitud" element={<PortalAspirante />} />
      {/* Examen académico en línea (habilitado por el admin en /admin/evaluaciones) */}
      <Route path="/portal/examen/:evaluationId" element={<ExamenAspirante />} />

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

      {/* MODIFICAR PAGINA WEB (INSTITUCIONAL) — admin y editor_web */}
      <Route
        path="/admin/institucional"
        element={
          <ProtectedRoute rol="editor_web">
            <AdminInstitucional />
          </ProtectedRoute>
        }
      />

      {/* RECURSOS INTERNOS ACADÉMICOS Y SUS OPCIONES — solo admin + candado */}
      <Route
        path="/admin/recursos"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminRecursosInternos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/solicitudes"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminAdmisiones />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/colecturia"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminPagosReingreso />
          </ProtectedRoute>
        }
      />

      {/* IMPORTAR ALUMNOS DE ANTIGUO INGRESO (MIGRACIÓN SQL -> FIREBASE) */}
      <Route
        path="/admin/importar-alumnos"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminImportarAlumnos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/codigos"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminCodigos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contratos"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminContrato />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contratos-firmados"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminContratosFirmados />
          </ProtectedRoute>
        }
      />

      {/* CONSTRUCTOR DE EXÁMENES */}
      <Route
        path="/admin/evaluaciones/constructor"
        element={
          <ProtectedRoute rol="admin" candado>
            <ExamTemplateBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evaluaciones"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminEvaluacionesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/aprobacion"
        element={
          <ProtectedRoute rol="admin" candado>
            <AdminAprobacionMatricula />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;