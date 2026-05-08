export type Movimiento = {
  tipo: "entrada" | "salida";
  cantidad: number;
};

export type Importancia = "estandar" | "baja" | "media" | "alta";
export type Categoria = "alimentacion" | "medicina" | "otros";

export type Urgencia = "ok" | "advertencia" | "critica";

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  alimentacion: "Alimentación",
  medicina: "Medicina",
  otros: "Otros",
};

export const IMPORTANCIA_LABEL: Record<Importancia, string> = {
  estandar: "Estándar",
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

const IMPORTANCIA_ORDER: Record<Importancia, number> = {
  alta: 0,
  media: 1,
  baja: 2,
  estandar: 3,
};

const URGENCIA_ORDER: Record<Urgencia, number> = {
  critica: 0,
  advertencia: 1,
  ok: 2,
};

export const calcularStock = (movimientos: Movimiento[]): number => {
  let total = 0;
  for (const m of movimientos) {
    const c = Number(m.cantidad) || 0;
    total += m.tipo === "entrada" ? c : -c;
  }
  return total;
};

const diasHasta = (fecha: string | null | undefined): number | null => {
  if (!fecha) return null;
  const d = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy.getTime()) / 86400000);
};

export const calcularUrgencia = (
  stock: number,
  punto_minimo: number,
  fecha_vencimiento: string | null | undefined,
): Urgencia => {
  const dias = diasHasta(fecha_vencimiento);
  const pm = Number(punto_minimo) || 0;
  if (stock <= pm) return "critica";
  if (dias !== null && dias <= 7) return "critica";
  if (stock <= pm * 1.5) return "advertencia";
  if (dias !== null && dias <= 30) return "advertencia";
  return "ok";
};

export type ProductoOrdenable = {
  punto_minimo: number;
  fecha_vencimiento: string | null;
  importancia: Importancia;
  stock: number;
};

export const ordenarPorUrgencia = <T extends ProductoOrdenable>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const ua = calcularUrgencia(a.stock, a.punto_minimo, a.fecha_vencimiento);
    const ub = calcularUrgencia(b.stock, b.punto_minimo, b.fecha_vencimiento);
    if (ua !== ub) return URGENCIA_ORDER[ua] - URGENCIA_ORDER[ub];
    return IMPORTANCIA_ORDER[a.importancia] - IMPORTANCIA_ORDER[b.importancia];
  });
};

export const contarCriticos = <T extends ProductoOrdenable>(items: T[]): number =>
  items.filter(
    (i) => calcularUrgencia(i.stock, i.punto_minimo, i.fecha_vencimiento) === "critica",
  ).length;
