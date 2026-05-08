// Convierte una fila de audit_log en texto legible para el usuario.
type AuditRow = {
  tabla: string;
  accion: string;
  cambios: any;
};

const tablaLabel: Record<string, string> = {
  animales: "Animal",
  animales_finca: "Animales de finca",
  potreros: "Potrero",
  inventario_productos: "Producto de inventario",
  inventario_movimientos: "Movimiento de inventario",
  empleados: "Empleado",
  empleado_fincas: "Asignación empleado-finca",
  fincas: "Finca",
  user_finca_acceso: "Acceso de usuario a finca",
  vacunaciones: "Vacunación",
  medicaciones: "Medicación",
  pesajes: "Pesaje",
  palpaciones: "Palpación",
  inseminaciones: "Inseminación",
  partos: "Parto",
  chequeos_veterinarios: "Chequeo veterinario",
  dietas: "Dieta",
  ciclos_calor: "Ciclo de calor",
  aspiraciones: "Aspiración",
  campeonatos: "Campeonato",
  embriones_recolectados: "Embriones recolectados",
  embriones_detalle: "Detalle de embrión",
};

const accionLabel: Record<string, string> = {
  INSERT: "Creó",
  UPDATE: "Actualizó",
  DELETE: "Eliminó",
};

function getRow(r: AuditRow): any {
  if (r.accion === "UPDATE") return r.cambios?.despues ?? r.cambios?.antes ?? {};
  return r.cambios ?? {};
}

function describir(r: AuditRow): string {
  const row = getRow(r);
  switch (r.tabla) {
    case "animales":
      return `${row.numero ?? ""}${row.nombre ? " · " + row.nombre : ""}`.trim() || "—";
    case "animales_finca":
      return `${row.tipo ?? ""}${row.cantidad != null ? " (" + row.cantidad + ")" : ""}`.trim() || "—";
    case "potreros":
      return `Nº ${row.numero ?? "—"}`;
    case "inventario_productos":
      return row.nombre ?? "—";
    case "inventario_movimientos":
      return `${row.tipo ?? ""} · ${row.cantidad ?? ""}`.trim();
    case "empleados":
      return row.nombre_completo ?? "—";
    case "fincas":
      return row.nombre ?? "—";
    case "vacunaciones":
      return row.vacuna ?? "—";
    case "medicaciones":
      return row.medicamento ?? "—";
    case "pesajes":
      return `${row.peso_kg ?? "—"} kg`;
    case "inseminaciones":
      return row.metodo ?? "—";
    case "partos":
      return row.resultado ?? "—";
    default:
      return "—";
  }
}

export function formatAuditEvent(r: AuditRow): string {
  const tabla = tablaLabel[r.tabla] ?? r.tabla;
  const accion = accionLabel[r.accion] ?? r.accion;
  const detalle = describir(r);
  return `${accion} ${tabla.toLowerCase()}: ${detalle}`;
}

export const TABLA_OPCIONES = Object.entries(tablaLabel).map(([value, label]) => ({
  value,
  label,
}));
