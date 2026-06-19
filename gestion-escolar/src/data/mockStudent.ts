// Lógica para calcular el próximo grado automáticamente
const calculateNextGrade = (currentGrade: string) => {
  const grades = [
    "Kinder 4", "Kinder 5", "Preparatoria", 
    "1° Grado", "2° Grado", "3° Grado", "4° Grado", "5° Grado", "6° Grado",
    "7° Grado", "8° Grado", "9° Grado", 
    "1er Año Bachillerato", "2do Año Bachillerato"
  ];
  const currentIndex = grades.indexOf(currentGrade);
  if (currentIndex === -1 || currentIndex === grades.length - 1) return "Graduado / No definido";
  return grades[currentIndex + 1];
};

export const mockStudentDB = {
  "20261507": {
    // === DATOS DE INGRESO ===
    anioIngreso: "2026",
    gradoActual: "Kinder 5",
    gradoMatricular: calculateNextGrade("Kinder 5"),

    // === DATOS DEL ALUMNO ===
    carnet: "20261507",
    nie: "12345678",
    nombres: "Carlos Daniel",
    apellidos: "García López",
    sexo: "MASCULINO",
    fechaNac: "2018-05-14",
    nacionalidad: "SALVADOREÑA",
    zona: "URBANA",
    departamento: "SANTA ANA",
    municipio: "CANDELARIA DE LA FRONTERA",
    telefono: "2440-0000",
    direccion: "Colonia Centro, Calle Principal #12",
    viveCon: "AMBOS PADRES",
    religion: "CRISTIANO CATOLICO",
    tipoSangre: "O+",
    enfermedades: "Ninguna",
    alergias: "Polvo",
    bautizado: "NO",
    confirmado: "NO",
    comunion: "NO",
    cursoParvularia: "NO",
    centroProcedencia: "Colegio Bautista",

    // === DATOS DEL PADRE DE FAMILIA ===
    padre: {
      nombre: "Juan Carlos García",
      lugarTrabajo: "Ministerio de Hacienda",
      telefonoTrabajo: "2244-5566",
      profesion: "Contador",
      cargo: "Auditor",
      telefonoFijo: "2440-1122",
      telefonoMovil: "7766-5544",
      email: "juan.garcia@mh.gob.sv",
      religion: "CRISTIANO CATOLICO"
    },

    // === DATOS DE LA MADRE DE FAMILIA ===
    madre: {
      nombre: "María Elena López",
      lugarTrabajo: "Hospital San Juan de Dios",
      telefonoTrabajo: "2440-9988",
      profesion: "Enfermera",
      cargo: "Jefa de piso",
      telefonoFijo: "2440-1122",
      telefonoMovil: "7888-9999",
      email: "maria.lopez@gmail.com",
      religion: "CRISTIANO CATOLICO"
    },

    // === EMERGENCIA Y ENCARGADO ===
    responsable: "AMBOS PADRES",
    emergencia: {
      llamarA: "María Elena López",
      telefono: "7888-9999"
    },
    encargado: {
      nombre: "",
      lugarTrabajo: "",
      telefonoTrabajo: "",
      profesion: "",
      cargo: "",
      telefonoFijo: "",
      telefonoMovil: "",
      email: "",
      religion: ""
    },

    // === TRANSPORTE ===
    transporte: {
      tipo: "VEHICULO PROPIO",
      nombreMotorista: "",
      placa: "",
      telefonoMotorista: ""
    },

    // === FACTURACIÓN ===
    facturacion: {
      nombreCompleto: "Juan Carlos García",
      direccion: "Colonia Centro, Calle Principal #12",
      telefono: "7766-5544",
      email: "juan.garcia@mh.gob.sv",
      dui: "01234567-8",
      nit: "0210-140580-101-1",
      profesion: "Contador",
      parentesco: "PADRE"
    }
  }
};