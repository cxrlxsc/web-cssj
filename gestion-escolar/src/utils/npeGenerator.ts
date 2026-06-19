// src/utils/npeGenerator.ts

const GRADE_CODES: Record<string, string> = {
  'KINDER 4': '01', 'KINDER 5': '02', 'PREPARATORIA': '03',
  'PRIMER GRADO': '11', 'SEGUNDO GRADO': '12', 'TERCER GRADO': '13',
  'CUARTO GRADO': '14', 'QUINTO GRADO': '15', 'SEXTO GRADO': '16',
  'SEPTIMO GRADO': '17', 'OCTAVO GRADO': '18', 'NOVENO GRADO': '19',
  'PRIMER AÑO DE BACHILLERATO': '21', 'SEGUNDO AÑO DE BACHILLERATO': '22',
  'PRIMER AÑO TÉC. DIS. GRÁFICO': '31', 'SEGUNDO AÑO TÉC. DIS. GRÁFICO': '32',
  'TERCER AÑO TÉC. DIS. GRÁFICO': '33', 'PRIMER AÑO TÉC. SIS. ELÉCTRICOS': '41',
  'SEGUNDO AÑO TÉC. SIS. ELÉCTRICOS': '42', 'TERCER AÑO TÉC. SIS. ELÉCTRICOS': '43',
  'PRIMER AÑO TÉC. DES. DE SOFTWARE': '51', 'SEGUNDO AÑO TÉC. DES. DE SOFTWARE': '52',
  'TERCER AÑO TÉC. DES. DE SOFTWARE': '53',
};

const GRADE_CODES_SHORT: Record<string, string> = {
  'Kinder 4': '01', 'Kinder 5': '02', 'Preparatoria': '03',
  '1° Grado': '11', '1°': '11', '2° Grado': '12', '2°': '12',
  '3° Grado': '13', '3°': '13', '4° Grado': '14', '4°': '14',
  '5° Grado': '15', '5°': '15', '6° Grado': '16', '6°': '16',
  '7° Grado': '17', '7°': '17', '8° Grado': '18', '8°': '18',
  '9° Grado': '19', '9°': '19', '1° Bachillerato': '21',
  '2° Bachillerato': '22', '1° Diseño Gráfico': '31',
  '2° Diseño Gráfico': '32', '3° Diseño Gráfico': '33',
  '1° Sistemas Eléctricos': '41', '2° Sistemas Eléctricos': '42',
  '3° Sistemas Eléctricos': '43', '1° Desarrollo de Software': '51',
  '2° Desarrollo de Software': '52', '3° Desarrollo de Software': '53',
};

function getGradeCode(grado: string): string {
  const upperGrado = grado.toUpperCase().trim();
  if (GRADE_CODES[upperGrado]) return GRADE_CODES[upperGrado];
  
  for (const [key, value] of Object.entries(GRADE_CODES_SHORT)) {
    if (grado.toLowerCase().includes(key.toLowerCase())) return value;
  }
  
  const match = grado.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1]);
    if (grado.toLowerCase().includes('kinder')) {
      if (num === 4) return '01';
      if (num === 5) return '02';
    }
    if (grado.toLowerCase().includes('grado')) {
      if (num >= 1 && num <= 6) return (10 + num).toString(); 
      if (num >= 7 && num <= 9) return (10 + num).toString(); 
    }
  }
  return '12'; 
}

function calcCosto(costo: number): string {
  const costoStr = costo.toFixed(2);
  const [enteroStr, decimalStr] = costoStr.split('.');
  return enteroStr.padStart(4, '0') + decimalStr;
}

function calcVerificador(npe: string): string {
  let acumuladorImpar = 0;
  let acumuladorPar = 0;
  
  for (let i = 0; i < npe.length; i += 2) {
    let valorTemporal = parseInt(npe[i]) * 2;
    if (valorTemporal >= 10) {
      acumuladorImpar += valorTemporal + 1;
    } else {
      acumuladorImpar += valorTemporal;
    }
  }
  
  for (let i = 1; i < npe.length; i += 2) {
    acumuladorPar += parseInt(npe[i]);
  }
  
  const a = acumuladorImpar + acumuladorPar;
  const b = Math.floor(a / 10);
  const c = b * 10;
  const d = a - c;
  const e = 10 - d;
  const f = Math.floor(e / 10);
  const g = f * 10;
  const vr = e - g;
  
  return vr.toString();
}

function formatNPE(npe: string): string {
  let resultado = '';
  for (let i = 0; i < npe.length; i += 4) {
    resultado += ' ' + npe.substring(i, i + 4);
  }
  return resultado.trim();
}

export function generarNPE(
  carnet: string, anho: string, mes: string, dia: string, costo: number, grado: string
): string {
  const banco = '0655';
  const npeSinVerificador = banco + calcCosto(costo) + anho + mes + dia + '0' + carnet + getGradeCode(grado) + mes + anho.substring(2, 4);
  const npeCompleto = npeSinVerificador + calcVerificador(npeSinVerificador);
  return formatNPE(npeCompleto);
}

export function generarNPEBarra(
  carnet: string, anho: string, mes: string, dia: string, costo: number, grado: string
): string {
  const GLN = '41574197000';
  const banco = '0655';
  const cantidad = '839020000';
  const fechamax = '96';
  const ref = '8020';
  return GLN + banco + cantidad + calcCosto(costo) + fechamax + anho + mes + dia + ref + carnet + getGradeCode(grado) + mes + anho.substring(2, 4);
}

export interface TalonarioInfo {
  npe: string;
  npeBarra: string;
  banco: string;
  concepto: string;
  monto: number;
  fechaLimite: string;
  estudiante: { carnet: string; nombre: string; grado: string; };
}

export function generarTalonario(
  carnet: string, nombreEstudiante: string, grado: string, concepto: string, monto: number, fechaLimite: Date
): TalonarioInfo {
  const anho = fechaLimite.getFullYear().toString();
  const mes = (fechaLimite.getMonth() + 1).toString().padStart(2, '0');
  const dia = fechaLimite.getDate().toString().padStart(2, '0');
  
  return {
    npe: generarNPE(carnet, anho, mes, dia, monto, grado),
    npeBarra: generarNPEBarra(carnet, anho, mes, dia, monto, grado),
    banco: 'Davivienda',
    concepto,
    monto,
    fechaLimite: fechaLimite.toISOString().split('T')[0],
    estudiante: { carnet, nombre: nombreEstudiante, grado }
  };
}