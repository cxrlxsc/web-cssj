// Formatear teléfono: +503 XXXX-XXXX
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const phoneNumbers = numbers.startsWith('503') ? numbers.slice(3) : numbers;
  const limited = phoneNumbers.slice(0, 8);
  if (limited.length === 0) return '';
  if (limited.length <= 4) return `+503 ${limited}`;
  return `+503 ${limited.slice(0, 4)}-${limited.slice(4)}`;
};

// Formatear DUI: XXXXXXXX-X
export const formatDui = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 9);
  if (limited.length <= 8) return limited;
  return `${limited.slice(0, 8)}-${limited.slice(8)}`;
};

// Validar que email contiene @
export const isValidEmail = (value: string): boolean => {
  return value.includes('@');
};
