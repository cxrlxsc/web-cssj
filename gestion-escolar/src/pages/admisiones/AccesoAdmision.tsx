// src/pages/PublicAdmissionForm.tsx
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 1. Subimos dos niveles (../../) para llegar a la carpeta components
import { Navbar } from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

// 2. Apuntamos al nuevo nombre de tu archivo CSS
import './Admisiones.css';

// 3. Subimos dos niveles para llegar a los servicios, utilidades y datos
import { accessCodeService } from '../../services/accessCodeService';
import { admissionService } from '../../services/admissionService';
import { formatPhone } from '../../utils/formatters';
import type { AccessCode } from '../../types';
import { departamentosElSalvador, getMunicipiosByDepartamento, getDistritosByMunicipio } from '../../data/elSalvadorGeo';



function parseDateInput(dateInput: string): Date {
  const [year, month, day] = dateInput.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export default function PublicAdmissionForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'code' | 'form' | 'success'>('code');
  const [accessCode, setAccessCode] = useState('');
  const [validatedCode, setValidatedCode] = useState<AccessCode | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [familyWarning, setFamilyWarning] = useState('');
  const [checkingFamilyWarning, setCheckingFamilyWarning] = useState(false);

  const [formData, setFormData] = useState({
    studentFirstName: '', studentLastName: '', dateOfBirth: '', gender: '' as '' | 'M' | 'F',
    previousSchool: '', gradeApplying: '',
    parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '', parentRelationship: '',
    departamento: '', municipio: '', distrito: '', direccion: '',
    howDidYouHear: '', comments: '',
  });

  const municipios = useMemo(() => { return formData.departamento ? getMunicipiosByDepartamento(formData.departamento) : []; }, [formData.departamento]);
  const distritos = useMemo(() => { return formData.departamento && formData.municipio ? getDistritosByMunicipio(formData.departamento, formData.municipio) : []; }, [formData.departamento, formData.municipio]);

  useEffect(() => { window.scrollTo(0, 0); }, [step]); // Scrolear arriba al cambiar de paso

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const existingAdmissions = await admissionService.getAdmissionsByAccessCode(accessCode.toUpperCase().trim());
      if (existingAdmissions.length > 0) {
        navigate(`/mi-solicitud?code=${accessCode.toUpperCase().trim()}`);
        return;
      }
      const result = await accessCodeService.validateCode(accessCode);
      if (result.valid && result.codeData) {
        setValidatedCode(result.codeData);
        setStep('form');
      } else {
        setError(result.message);
      }
    } catch (err) { setError('Error al validar el código. Intente de nuevo.'); } 
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'parentEmail') setFamilyWarning('');
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadFamilyWarning = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) { setFamilyWarning(''); return; }
    setCheckingFamilyWarning(true);
    try {
      const familyAdmissions = await admissionService.getAdmissionsByParentEmail(normalizedEmail);
      if (familyAdmissions.length === 0) { setFamilyWarning(''); return; }
      const relatedStudents = familyAdmissions.slice(0, 3).map(admission => `${admission.studentFirstName} ${admission.studentLastName}`.trim()).join(', ');
      const additionalCount = familyAdmissions.length - Math.min(familyAdmissions.length, 3);
      setFamilyWarning(`Este correo ya aparece en ${familyAdmissions.length} solicitud(es): ${relatedStudents}${additionalCount > 0 ? ` y ${additionalCount} más` : ''}. Puede continuar si es otro hijo/a.`);
    } catch (warningError) { setFamilyWarning(''); } 
    finally { setCheckingFamilyWarning(false); }
  };

  const handleParentEmailBlur = async () => { await loadFamilyWarning(formData.parentEmail); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (formData.gender !== 'M' && formData.gender !== 'F') {
      setError('Por favor selecciona el género del estudiante'); setLoading(false); return;
    }
    try {
      await admissionService.createAdmission({
        ...formData, gender: formData.gender as 'M' | 'F', dateOfBirth: parseDateInput(formData.dateOfBirth),
        status: 'pending', applicationDate: new Date(), documents: [],
        accessCodeUsed: validatedCode?.code, enrollmentYear: validatedCode?.year,
      });
      if (validatedCode) {
        await accessCodeService.useCode(validatedCode.id, {
          name: `${formData.studentFirstName} ${formData.studentLastName}`, grade: formData.gradeApplying,
          email: formData.parentEmail, phone: formData.parentPhone
        });
      }
      setStep('success');
    } catch (err: any) { setError(err.message || 'Error al enviar la solicitud'); } 
    finally { setLoading(false); }
  };

  const grades = [
    'Kinder 4', 'Kinder 5', 'Preparatoria', '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado',
    '7° Grado', '8° Grado', '9° Grado', '1° Bachillerato', '2° Bachillerato',
  ];

  return (
    <div className="admission-page">
      <Navbar />

      <section className="hero-admission" data-aos="fade-in">
        <span className="badge-premium" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
          Admisiones {validatedCode?.year || '2026'}
        </span>
        <h1 className="titulo-admission">
          Portal de <span style={{ color: '#FAB529' }}>Aspirantes</span>
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.9)', fontSize: '1.15rem' }}>
          Sistema seguro de registro para estudiantes de nuevo ingreso al Colegio Salesiano San José.
        </p>
      </section>

      <section className="admission-container" data-aos="fade-up">
        <div className="admission-card">
          
          {/* PASO 1: CÓDIGO */}
          {step === 'code' && (
            <div className="code-validation-box">
              <div className="code-icon">
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
              </div>
              <h2 style={{ color: '#002a4a', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Código de Acceso</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>Ingrese el código (PIN) proporcionado por el departamento de Registro Académico para iniciar o retomar su solicitud.</p>
              
              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleValidateCode}>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="input-codigo"
                  placeholder="Ej. CSSJ-XXXX"
                  required
                />
                <button type="submit" className="btn-principal" disabled={loading || !accessCode}>
                  {loading ? 'Verificando sistema...' : 'Verificar y Continuar'}
                </button>
              </form>
              
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem' }}>
                ¿Aún no tiene un código? Solicítelo en Admisiones o llamando al <strong style={{ color: '#0068B3' }}>2440-0000</strong>
              </p>
            </div>
          )}

          {/* PASO 2: FORMULARIO DE ADMISIÓN */}
          {step === 'form' && (
            <form onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <p style={{ color: '#008C5A', fontWeight: 800, background: '#f0fdf4', display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '50px', fontSize: '0.9rem' }}>
                  Código Validado: {validatedCode?.code}
                </p>
              </div>

              {error && <div className="error-message">{error}</div>}

              {/* Sección 1: Estudiante */}
              <h3 className="form-section-title">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                Datos del Aspirante
              </h3>
              <div className="form-grid">
                <div>
                  <label className="input-label">Nombres *</label>
                  <input type="text" name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Apellidos *</label>
                  <input type="text" name="studentLastName" value={formData.studentLastName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Fecha de Nacimiento *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Género *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required className="select-field">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Grado a Cursar *</label>
                  <select name="gradeApplying" value={formData.gradeApplying} onChange={handleChange} required className="select-field">
                    <option value="">Seleccionar grado...</option>
                    {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Colegio de Procedencia</label>
                  <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="input-field" placeholder="Opcional" />
                </div>
              </div>

              {/* Sección 2: Responsable */}
              <h3 className="form-section-title" style={{ color: '#008C5A' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                Datos del Responsable Familiar
              </h3>
              <div className="form-grid">
                <div>
                  <label className="input-label">Nombres del Responsable *</label>
                  <input type="text" name="parentFirstName" value={formData.parentFirstName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Apellidos del Responsable *</label>
                  <input type="text" name="parentLastName" value={formData.parentLastName} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Correo Electrónico *</label>
                  <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} onBlur={handleParentEmailBlur} required className="input-field" />
                  {familyWarning && <p style={{ color: '#d97706', fontSize: '0.8rem', marginTop: '0.5rem' }}>{familyWarning}</p>}
                </div>
                <div>
                  <label className="input-label">Teléfono Móvil *</label>
                  <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'parentPhone', value: formatPhone(e.target.value) } } as React.ChangeEvent<HTMLInputElement>)} required className="input-field" placeholder="0000-0000" />
                </div>
                <div>
                  <label className="input-label">Parentesco *</label>
                  <select name="parentRelationship" value={formData.parentRelationship} onChange={handleChange} required className="select-field">
                    <option value="">Seleccionar...</option>
                    <option value="padre">Padre</option>
                    <option value="madre">Madre</option>
                    <option value="tutor">Tutor Legal</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Residencia */}
              <h3 className="form-section-title" style={{ color: '#FAB529' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Dirección de Residencia
              </h3>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div>
                  <label className="input-label">Departamento *</label>
                  <select name="departamento" value={formData.departamento} onChange={(e) => setFormData(p => ({...p, departamento: e.target.value, municipio: '', distrito: ''}))} required className="select-field">
                    <option value="">Seleccionar...</option>
                    {departamentosElSalvador.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Municipio *</label>
                  <select name="municipio" value={formData.municipio} onChange={(e) => setFormData(p => ({...p, municipio: e.target.value, distrito: ''}))} required disabled={!formData.departamento} className="select-field">
                    <option value="">Seleccionar...</option>
                    {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Distrito *</label>
                  <select name="distrito" value={formData.distrito} onChange={handleChange} required disabled={!formData.municipio} className="select-field">
                    <option value="">Seleccionar...</option>
                    {distritos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Dirección Específica (Pasaje, N° Casa) *</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required className="input-field" />
                </div>
              </div>

              {/* Botones */}
              <div className="form-actions">
                <button type="button" onClick={() => setStep('code')} className="btn-secundario">← Volver al Código</button>
                <button type="submit" disabled={loading} className="btn-enviar-solicitud">
                  {loading ? 'Procesando...' : 'Enviar Solicitud al Colegio'}
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: ÉXITO */}
          {step === 'success' && (
            <div className="success-box">
              <div className="success-icon">
                <svg width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ margin: '0 auto' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 style={{ color: '#002a4a', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>¡Solicitud Registrada!</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem' }}>El expediente inicial del estudiante ha sido creado exitosamente en el sistema.</p>
              
              <div className="resumen-datos">
                <p><strong>Aspirante:</strong> {formData.studentFirstName} {formData.studentLastName}</p>
                <p><strong>Nivel a cursar:</strong> {formData.gradeApplying}</p>
                <p><strong>Código Asignado:</strong> <span style={{ color: '#008C5A', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}>{validatedCode?.code}</span></p>
              </div>

              <div style={{ background: '#e0f2fe', padding: '1.5rem', borderRadius: '12px', color: '#0068B3', marginBottom: '2rem' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>El siguiente paso es acceder al Portal de Aspirantes utilizando su código para cargar los documentos en formato digital (Notas, Partida de Nacimiento, DUI).</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to={`/mi-solicitud?code=${validatedCode?.code}`} className="btn-enviar-solicitud" style={{ textDecoration: 'none' }}>
                  Ir al Portal y Cargar Documentos
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}