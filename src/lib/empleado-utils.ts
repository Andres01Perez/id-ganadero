export const calcularEdad = (fechaNac: string | null | undefined): number | null => {
  if (!fechaNac) return null;
  const d = new Date(fechaNac);
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
  return edad >= 0 ? edad : null;
};

export const esCumpleHoy = (fechaNac: string | null | undefined): boolean => {
  if (!fechaNac) return false;
  const d = new Date(fechaNac);
  if (Number.isNaN(d.getTime())) return false;
  const hoy = new Date();
  return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth();
};

export const hoyISO = (): string => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};
