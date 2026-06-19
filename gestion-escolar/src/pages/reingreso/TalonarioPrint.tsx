import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode'; // <-- IMPORTAMOS LA LIBRERÍA DE CÓDIGOS DE BARRA
import { mockStudentDB } from '../../data/mockStudent';
import { generarTalonario, type TalonarioInfo } from '../../utils/npeGenerator';
import logoImg from '../../assets/logo.png'; 

export const TalonarioPrint = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [datosTalonario, setDatosTalonario] = useState<TalonarioInfo | null>(null);

  useEffect(() => {
    const sessionCarnet = localStorage.getItem('studentSession');
    if (!sessionCarnet || !mockStudentDB[sessionCarnet as keyof typeof mockStudentDB]) {
      navigate('/reingreso/login'); 
    } else {
      const studentData = mockStudentDB[sessionCarnet as keyof typeof mockStudentDB];
      setStudent(studentData);

      // Generamos el NPE real y la cadena del código de barras
      const talonarioGenerado = generarTalonario(
        studentData.carnet,
        `${studentData.nombres} ${studentData.apellidos}`,
        studentData.gradoMatricular,
        "Matrícula 2026 y Primera Cuota",
        145.00, 
        new Date(2026, 6, 31) 
      );
      setDatosTalonario(talonarioGenerado);
    }
  }, [navigate]);

  if (!student || !datosTalonario) return <div>Cargando comprobante seguro...</div>;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      
      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => window.close()} style={{ padding: '0.8rem 1.5rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cerrar</button>
        <button onClick={() => window.print()} style={{ padding: '0.8rem 1.5rem', background: '#0068B3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Imprimir / Guardar PDF</button>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        
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
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626', fontWeight: 'bold' }}>Vence: 31/07/2026</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Estudiante</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>{datosTalonario.estudiante.nombre}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Carnet / NIE</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>{student.carnet} / {student.nie}</p>
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
          
          {/* El NPE en texto */}
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '2.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#002a4a', letterSpacing: '2px' }}>
            {datosTalonario.npe}
          </p>

          {/* El Código de Barras dibujado */}
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
          @media print {
            .no-print { display: none !important; }
            body { background: white; }
          }
        `}
      </style>
    </div>
  );
};