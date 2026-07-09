// src/pages/reingreso/TalonarioPrint.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { alumnoService } from '../../services/alumnoService';
import { configService } from '../../services/configService';
import { generarTalonario, type TalonarioInfo } from '../../utils/npeGenerator';
import { obtenerSesionEstudiante, cerrarSesionEstudiante } from '../../auth/studentSession';
import logoImg from '../../assets/logo.png';

export const TalonarioPrint = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [datosTalonario, setDatosTalonario] = useState<TalonarioInfo | null>(null);

  useEffect(() => {
    (async () => {
      // Datos del ciclo escolar activo (año y fecha límite). El monto depende
      // del GRADO del alumno (aranceles por grado en la colecturía).
      const config = await configService.getConfigMatricula();
      const concepto = `Matrícula ${config.anioMatricula} y Primera Cuota`;
      const fechaLimite = new Date(`${config.fechaLimitePago}T00:00:00`);

      // 1. Verificamos primero si viene con un PASE VIP de Nuevo Ingreso por la URL
      const source = searchParams.get('source');

      if (source === 'nuevo_ingreso') {
        // Es un aspirante de Nuevo Ingreso. Armamos sus datos desde la URL.
        const nombreUrl = searchParams.get('nombre') || '';
        const apellidoUrl = searchParams.get('apellido') || '';
        const gradoUrl = searchParams.get('grado') || '';
        const codigoAspirante = searchParams.get('codigo') || 'ASP-0000';
        // El NPE exige un carnet numérico de 8 dígitos; el código trae letras y guion (ej: CSSJ-0042)
        const carnetNumerico = (codigoAspirante.match(/\d+/g)?.join('') || '0').padStart(8, '0').slice(-8);

        const aspiranteData = {
          carnet: carnetNumerico, // Carnet temporal numérico derivado del código del aspirante
          nie: 'PENDIENTE',
          nombres: nombreUrl,
          apellidos: apellidoUrl,
          gradoMatricular: gradoUrl
        };

        setStudent(aspiranteData);
        const arancel = await configService.getArancelParaGrado(aspiranteData.gradoMatricular);
        setDatosTalonario(generarTalonario(
          aspiranteData.carnet,
          `${aspiranteData.nombres} ${aspiranteData.apellidos}`,
          aspiranteData.gradoMatricular,
          concepto,
          arancel.cuotaMatricula,
          fechaLimite
        ));

      } else {
        // 2. Si no es Nuevo Ingreso, buscamos si es un alumno Antiguo (Reingreso) en Firebase
        const sessionCarnet = await obtenerSesionEstudiante();

        if (!sessionCarnet) {
          // Si no tiene pase VIP ni sesión de antiguo, lo expulsamos al login
          navigate('/reingreso/login');
          return;
        }

        const studentData = await alumnoService.getAlumno(sessionCarnet);
        if (!studentData) {
          await cerrarSesionEstudiante();
          navigate('/reingreso/login');
          return;
        }
        setStudent(studentData);
        const arancel = await configService.getArancelParaGrado(studentData.gradoMatricular);
        setDatosTalonario(generarTalonario(
          studentData.carnet,
          `${studentData.nombres} ${studentData.apellidos}`,
          studentData.gradoMatricular,
          concepto,
          arancel.cuotaMatricula,
          fechaLimite
        ));
      }
    })().catch(() => navigate('/reingreso/login'));
  }, [navigate, searchParams]);

  if (!student || !datosTalonario) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando comprobante seguro...</div>;

  return (
    <div className="talonario-screen" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => window.close()} style={{ padding: '0.8rem 1.5rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cerrar</button>
        <button onClick={() => window.print()} style={{ padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir / Guardar PDF</button>
      </div>

      <div className="talonario-card" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #008C5A', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logoImg} alt="Colegio Salesiano" style={{ width: '60px' }} />
            <div>
              <h2 style={{ margin: 0, color: '#008C5A', fontSize: '1.2rem' }}>COLEGIO SALESIANO SAN JOSÉ</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Santa Ana, El Salvador</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>MANDAMIENTO DE PAGO</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626', fontWeight: 'bold' }}>
              Vence: {datosTalonario.fechaLimite.split('-').reverse().join('/')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Estudiante</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>{datosTalonario.estudiante.nombre}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Carnet / Código</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>{student.carnet}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Grado a cursar</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>{datosTalonario.estudiante.grado}</p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '0.8rem 0', color: '#334155' }}>Descripción del Concepto</th>
              <th style={{ padding: '0.8rem 0', color: '#334155', textAlign: 'right' }}>Importe Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1rem 0', fontSize: '1.1rem' }}>{datosTalonario.concepto}</td>
              <td style={{ padding: '1rem 0', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right' }}>$ {datosTalonario.monto.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* CONTENEDOR DEL NPE Y CÓDIGO DE BARRAS */}
        <div style={{ textAlign: 'center', border: '2px dashed #94a3b8', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', background: '#f1f5f9' }}>
          <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontWeight: 'bold', letterSpacing: '2px' }}>NÚMERO DE PAGO ELECTRÓNICO (NPE)</p>
          
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '2.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#002a4a', letterSpacing: '2px' }}>
            {datosTalonario.npe}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content', margin: '0 auto' }}>
            <Barcode 
              value={datosTalonario.npeBarra} 
              format="CODE128" 
              width={1.2} 
              height={60} 
              fontSize={12}
              background="transparent"
              lineColor="#0f172a"
            />
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
          <p>Puede cancelar este comprobante a través de los canales electrónicos o agencias de:</p>
          <p style={{ fontWeight: 'bold', color: '#334155', fontSize: '1rem' }}>{datosTalonario.banco}</p>
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>Este documento no es válido como factura. Solicite su comprobante de crédito fiscal o factura de consumidor final en colecturía posterior al pago.</p>
        </div>

      </div>

      <style>
        {`
          @page { margin: 1cm; }
          @media print {
            .no-print { display: none !important; }
            html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
            /* En impresión, neutralizamos el contenedor de pantalla para que el
               contrato quepa en una sola página y no salga en blanco. */
            .talonario-screen { background: #ffffff !important; min-height: 0 !important; padding: 0 !important; }
            .talonario-card { box-shadow: none !important; border: none !important; margin: 0 auto !important; max-width: 100% !important; padding: 0 !important; }
            /* Forzar impresión de colores/fondos (NPE, código de barras). */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>
    </div>
  );
};