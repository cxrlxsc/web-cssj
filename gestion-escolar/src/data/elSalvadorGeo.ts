// Datos geográficos de El Salvador
// Estructura: Departamentos > Municipios > Distritos
// Municipio = división administrativa principal del departamento
// Distrito = subdivisión/localidad dentro de un municipio

export interface Municipio {
  nombre: string;
  distritos: string[];
}

export interface Departamento {
  nombre: string;
  municipios: Municipio[];
}

export const departamentosElSalvador: Departamento[] = [
  {
    nombre: 'Ahuachapán',
    municipios: [
      { 
        nombre: 'Ahuachapán Norte', 
        distritos: ['Atiquizaya', 'El Refugio', 'San Lorenzo', 'Turín'] 
      },
      { 
        nombre: 'Ahuachapán Centro', 
        distritos: ['Ahuachapán', 'Apaneca', 'Concepción de Ataco', 'Tacuba'] 
      },
      { 
        nombre: 'Ahuachapán Sur', 
        distritos: ['Guaymango', 'Jujutla', 'San Francisco Menéndez', 'San Pedro Puxtla'] 
      },
    ]
  },
  {
    nombre: 'Chalatenango',
    municipios: [
      { 
        nombre: 'Chalatenango Norte', 
        distritos: ['Citalá', 'La Palma', 'San Ignacio'] 
      },
      { 
        nombre: 'Chalatenango Centro', 
        distritos: ['Agua Caliente', 'Dulce Nombre de María', 'El Paraíso', 'La Reina', 'Nueva Concepción', 'San Fernando', 'San Francisco Morazán', 'San Rafael', 'Santa Rita', 'Tejutla'] 
      },
      { 
        nombre: 'Chalatenango Sur', 
        distritos: ['Arcatao', 'Azacualpa', 'Cancasque', 'Chalatenango', 'Comalapa', 'Concepción Quezaltepeque', 'El Carrizal', 'La Laguna', 'Las Vueltas', 'Las Flores', 'Nombre de Jesús', 'Nueva Trinidad', 'Ojos de Agua', 'Potonico', 'San Antonio de la Cruz', 'San Antonio Los Ranchos', 'San Francisco Lempa', 'San Isidro Labrador', 'San Luis del Carmen', 'San Miguel de Mercedes'] 
      },
    ]
  },
  {
    nombre: 'La Libertad',
    municipios: [
      { 
        nombre: 'La Libertad Norte', 
        distritos: ['Quezaltepeque', 'San Matías', 'San Pablo Tacachico'] 
      },
      { 
        nombre: 'La Libertad Centro', 
        distritos: ['San Juan Opico', 'Ciudad Arce'] 
      },
      { 
        nombre: 'La Libertad Oeste', 
        distritos: ['Colón', 'Jayaque', 'Sacacoyo', 'Tepecoyo', 'Talnique'] 
      },
      { 
        nombre: 'La Libertad Este', 
        distritos: ['Antiguo Cuscatlán', 'Huizúcar', 'Nuevo Cuscatlán', 'San José Villanueva', 'Zaragoza'] 
      },
      { 
        nombre: 'La Libertad Costa', 
        distritos: ['Chiltiupán', 'Jicalapa', 'La Libertad', 'Tamanique', 'Teotepeque'] 
      },
      { 
        nombre: 'La Libertad Sur', 
        distritos: ['Santa Tecla', 'Comasagua'] 
      },
    ]
  },
  {
    nombre: 'Santa Ana',
    municipios: [
      { 
        nombre: 'Santa Ana Norte', 
        distritos: ['Masahuat', 'Metapán', 'Santa Rosa Guachipilín', 'Texistepeque'] 
      },
      { 
        nombre: 'Santa Ana Centro', 
        distritos: ['Santa Ana'] 
      },
      { 
        nombre: 'Santa Ana Este', 
        distritos: ['Coatepeque', 'El Congo'] 
      },
      { 
        nombre: 'Santa Ana Oeste', 
        distritos: ['Candelaria de la Frontera', 'Chalchuapa', 'El Porvenir', 'San Antonio Pajonal', 'San Sebastián Salitrillo', 'Santiago de la Frontera'] 
      },
    ]
  },
  {
    nombre: 'Sonsonate',
    municipios: [
      { 
        nombre: 'Sonsonate Norte', 
        distritos: ['Juayúa', 'Nahuizalco', 'Salcoatitán', 'Santa Catarina Masahuat'] 
      },
      { 
        nombre: 'Sonsonate Centro', 
        distritos: ['Sonsonate', 'Sonzacate', 'Nahulingo', 'San Antonio del Monte', 'Santo Domingo de Guzmán'] 
      },
      { 
        nombre: 'Sonsonate Este', 
        distritos: ['Armenia', 'Caluco', 'Cuisnahuat', 'Izalco', 'San Julián', 'Santa Isabel Ishuatán'] 
      },
      { 
        nombre: 'Sonsonate Oeste', 
        distritos: ['Acajutla'] 
      },
    ]
  },
];

// Helper para obtener los municipios de un departamento
export const getMunicipiosByDepartamento = (departamentoNombre: string): string[] => {
  const depto = departamentosElSalvador.find(d => d.nombre === departamentoNombre);
  if (!depto) return [];
  return depto.municipios.map(m => m.nombre);
};

// Helper para obtener los distritos de un municipio específico
export const getDistritosByMunicipio = (departamentoNombre: string, municipioNombre: string): string[] => {
  const depto = departamentosElSalvador.find(d => d.nombre === departamentoNombre);
  if (!depto) return [];
  
  const municipio = depto.municipios.find(m => m.nombre === municipioNombre);
  return municipio ? municipio.distritos : [];
};
