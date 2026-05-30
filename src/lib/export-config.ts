import { seguimientoConfigs, type SeguimientoTipo } from "./seguimiento-config";

export type ExportFieldType = "text" | "number" | "date" | "boolean";

export type ExportField = {
  key: string;
  label: string;
  type: ExportFieldType;
};

export type ExportBloque = {
  key: string;
  label: string;
  /** Tabla de Supabase a consultar */
  table: string;
  /** Columnas a pedir al .select() (sin alias) — siempre incluye lo necesario para filtros y joins */
  baseSelect: string;
  /** Campos elegibles por el usuario */
  fields: ExportField[];
  /** Si true, requiere filtrar por animal accesible en una de las fincas elegidas (seguimientos) */
  porAnimal?: boolean;
  /** Si true, requiere filtrar por finca_id directo */
  porFinca?: boolean;
  /** Nombre del campo de fecha principal para filtros desde/hasta */
  fechaField?: string;
  /** Para empleados: filtrado vía empleado_fincas */
  porEmpleadoFinca?: boolean;
  /** Nombre de la hoja en Excel */
  sheetName: string;
};

/** Bloque "Animales" */
const animalesFields: ExportField[] = [
  { key: "numero", label: "Número", type: "text" },
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "tipo", label: "Tipo", type: "text" },
  { key: "sexo", label: "Sexo", type: "text" },
  { key: "raza", label: "Raza", type: "text" },
  { key: "color", label: "Color", type: "text" },
  { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { key: "numero_registro", label: "Número de registro", type: "text" },
  { key: "activo", label: "Activo", type: "boolean" },
  { key: "finca_nombre", label: "Finca", type: "text" },
  { key: "padre_label", label: "Padre", type: "text" },
  { key: "madre_label", label: "Madre", type: "text" },
];

/** Convierte una config de seguimiento en un bloque exportable */
const seguimientoToBloque = (tipo: SeguimientoTipo): ExportBloque => {
  const cfg = seguimientoConfigs[tipo];
  const baseFields: ExportField[] = [
    { key: "animal_numero", label: "Animal número", type: "text" },
    { key: "animal_nombre", label: "Animal nombre", type: "text" },
    ...cfg.fields.map<ExportField>((f) => ({
      key: f.name,
      label: f.label,
      type:
        f.type === "date"
          ? "date"
          : f.type === "number"
          ? "number"
          : "text",
    })),
  ];
  return {
    key: `seg_${tipo}`,
    label: cfg.title,
    table: cfg.table,
    baseSelect: "*",
    fields: baseFields,
    porAnimal: true,
    fechaField: cfg.orderField,
    sheetName: cfg.title.slice(0, 31),
  };
};

const vacunacionesBloque: ExportBloque = {
  key: "vacunaciones",
  label: "Vacunaciones",
  table: "vacunaciones",
  baseSelect: "*",
  porAnimal: true,
  fechaField: "fecha",
  sheetName: "Vacunaciones",
  fields: [
    { key: "animal_numero", label: "Animal número", type: "text" },
    { key: "animal_nombre", label: "Animal nombre", type: "text" },
    { key: "fecha", label: "Fecha", type: "date" },
    { key: "vacuna", label: "Vacuna", type: "text" },
    { key: "lote", label: "Lote", type: "text" },
    { key: "proxima_dosis", label: "Próxima dosis", type: "date" },
    { key: "notas", label: "Notas", type: "text" },
  ],
};

const medicacionesBloque: ExportBloque = {
  key: "medicaciones",
  label: "Medicaciones",
  table: "medicaciones",
  baseSelect: "*",
  porAnimal: true,
  fechaField: "fecha",
  sheetName: "Medicaciones",
  fields: [
    { key: "animal_numero", label: "Animal número", type: "text" },
    { key: "animal_nombre", label: "Animal nombre", type: "text" },
    { key: "fecha", label: "Fecha", type: "date" },
    { key: "medicamento", label: "Medicamento", type: "text" },
    { key: "dosis", label: "Dosis", type: "text" },
    { key: "dias_tratamiento", label: "Días de tratamiento", type: "number" },
    { key: "motivo", label: "Motivo", type: "text" },
    { key: "notas", label: "Notas", type: "text" },
  ],
};

const empleadosBloque: ExportBloque = {
  key: "empleados",
  label: "Empleados",
  table: "empleados",
  baseSelect: "*",
  porEmpleadoFinca: true,
  sheetName: "Empleados",
  fields: [
    { key: "cedula", label: "Cédula", type: "text" },
    { key: "nombre_completo", label: "Nombre completo", type: "text" },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
    { key: "fecha_ingreso", label: "Fecha de ingreso", type: "date" },
    { key: "fecha_salida", label: "Fecha de salida", type: "date" },
    { key: "activo", label: "Activo", type: "boolean" },
    { key: "notas", label: "Notas", type: "text" },
    { key: "fincas", label: "Fincas asignadas", type: "text" },
  ],
};

const potrerosBloque: ExportBloque = {
  key: "potreros",
  label: "Potreros",
  table: "potreros",
  baseSelect: "*",
  porFinca: true,
  sheetName: "Potreros",
  fields: [
    { key: "numero", label: "Número", type: "text" },
    { key: "hectareas", label: "Hectáreas", type: "number" },
    { key: "estado", label: "Estado", type: "text" },
    { key: "notas", label: "Notas", type: "text" },
    { key: "finca_nombre", label: "Finca", type: "text" },
  ],
};

export const exportBloques: ExportBloque[] = [
  {
    key: "animales",
    label: "Animales",
    table: "animales",
    baseSelect: "*",
    porFinca: true,
    fechaField: "fecha_nacimiento",
    sheetName: "Animales",
    fields: animalesFields,
  },
  ...(Object.keys(seguimientoConfigs) as SeguimientoTipo[]).map(seguimientoToBloque),
  vacunacionesBloque,
  medicacionesBloque,
  empleadosBloque,
  potrerosBloque,
];

export const findBloque = (key: string) =>
  exportBloques.find((b) => b.key === key);

export type BloqueSeleccion = {
  key: string;
  campos: string[];
  fechaDesde?: string;
  fechaHasta?: string;
  filtroTipo?: "macho" | "hembra" | "cria" | "embrion" | "todos";
  filtroActivo?: "si" | "no" | "todos";
};

export type ExportConfig = {
  fincaIds: string[];
  bloques: BloqueSeleccion[];
};
