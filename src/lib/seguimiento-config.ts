import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Award,
  Baby,
  Beef,
  ClipboardPlus,
  Dna,
  HeartPulse,
  Scale,
  Soup,
  Syringe,
} from "lucide-react";

export type FieldType = "date" | "time" | "text" | "number" | "textarea" | "select" | "animal" | "file";

export type SeguimientoTipo =
  | "calor"
  | "aspiraciones"
  | "embriones"
  | "palpaciones"
  | "cruces"
  | "dieta"
  | "peso"
  | "partos"
  | "chequeo"
  | "campeonatos";

export type SeguimientoField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export type SeguimientoConfig = {
  tipo: SeguimientoTipo;
  title: string;
  subtitle: string;
  table: string;
  animalField: string;
  orderField: string;
  icon: LucideIcon;
  evidenceFolder?: string;
  note?: string;
  fields: SeguimientoField[];
  primary: (row: Record<string, unknown>) => string;
  details: (row: Record<string, unknown>) => string[];
};

export const seguimientoConfigs: Record<SeguimientoTipo, SeguimientoConfig> = {
  calor: {
    tipo: "calor",
    title: "Control de celo",
    subtitle: "Historial de ciclos y próximos calores.",
    table: "ciclos_calor",
    animalField: "animal_id",
    orderField: "fecha",
    icon: HeartPulse,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "fecha_proximo_estimado", label: "Próximo calor estimado", type: "date" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => `Calor registrado: ${formatDate(String(r.fecha ?? ""))}`,
    details: (r) => [
      r.fecha_proximo_estimado ? `Próximo: ${formatDate(String(r.fecha_proximo_estimado))}` : "",
      String(r.notas ?? ""),
    ],
  },
  aspiraciones: {
    tipo: "aspiraciones",
    title: "Aspiraciones",
    subtitle: "Procedimientos realizados a la donadora.",
    table: "aspiraciones",
    animalField: "animal_id",
    orderField: "fecha",
    icon: Syringe,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "cantidad_ovocitos", label: "Cantidad de ovocitos", type: "number" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => `${r.cantidad_ovocitos ?? "—"} ovocitos`,
    details: (r) => [formatDate(String(r.fecha ?? "")), String(r.notas ?? "")],
  },
  embriones: {
    tipo: "embriones",
    title: "Embriones",
    subtitle: "Seguimiento del embrión y su estado reproductivo.",
    table: "embriones_detalle",
    animalField: "animal_id",
    orderField: "updated_at",
    icon: Dna,
    note: "Esta sección es para seguimiento del embrión. Para registrar una aspiración de donadora usa Aspiraciones.",
    fields: [
      {
        name: "estado_embrion",
        label: "Estado del embrión",
        type: "select",
        options: [
          { value: "congelado", label: "Congelado" },
          { value: "transferido", label: "Transferido" },
          { value: "implantado", label: "Implantado" },
          { value: "perdido", label: "Perdido" },
          { value: "nacido", label: "Nacido" },
        ],
      },
      { name: "fecha_transferencia", label: "Fecha de transferencia", type: "date" },
      { name: "donadora_id", label: "Donadora", type: "animal" },
      { name: "receptora_id", label: "Receptora", type: "animal" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => labelFromValue(String(r.estado_embrion ?? ""), "embriones") || "Sin estado registrado",
    details: (r) => [
      r.fecha_transferencia ? `Transferencia: ${formatDate(String(r.fecha_transferencia))}` : "",
      String(r.notas ?? ""),
    ],
  },
  palpaciones: {
    tipo: "palpaciones",
    title: "Palpaciones",
    subtitle: "Resultados y tiempo de preñez.",
    table: "palpaciones",
    animalField: "animal_id",
    orderField: "fecha",
    icon: Activity,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "resultado", label: "Resultado", type: "select", required: true, options: [{ value: "positivo", label: "Positivo" }, { value: "negativo", label: "Negativo" }] },
      { name: "tiempo_prenez_dias", label: "Tiempo de preñez en días", type: "number" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => `Resultado: ${labelFromValue(String(r.resultado ?? ""), "palpaciones")}`,
    details: (r) => [formatDate(String(r.fecha ?? "")), r.tiempo_prenez_dias ? `${r.tiempo_prenez_dias} días de preñez` : "", String(r.notas ?? "")],
  },
  cruces: {
    tipo: "cruces",
    title: "Cruces",
    subtitle: "Servicios, inseminaciones y transferencias.",
    table: "inseminaciones",
    animalField: "animal_id",
    orderField: "fecha",
    icon: Beef,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "hora", label: "Hora", type: "time" },
      { name: "metodo", label: "Método", type: "select", required: true, options: [
        { value: "monta_directa", label: "Monta directa" },
        { value: "inseminacion_artificial", label: "Inseminación artificial" },
        { value: "fiv", label: "FIV" },
        { value: "transferencia_embrion", label: "Transferencia de embrión" },
      ] },
      { name: "toro_id", label: "Toro de la finca", type: "animal" },
      { name: "toro_externo_nombre", label: "Nombre de toro externo", type: "text" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => labelFromValue(String(r.metodo ?? ""), "cruces") || "Cruce registrado",
    details: (r) => [formatDate(String(r.fecha ?? "")), String(r.toro_externo_nombre ?? ""), String(r.notas ?? "")],
  },
  dieta: {
    tipo: "dieta",
    title: "Dieta",
    subtitle: "Alimentación y consumo diario.",
    table: "dietas",
    animalField: "animal_id",
    orderField: "fecha_inicio",
    icon: Soup,
    fields: [
      { name: "fecha_inicio", label: "Fecha de inicio", type: "date", required: true },
      { name: "fecha_fin", label: "Fecha de fin", type: "date" },
      { name: "tipo_alimento", label: "Tipo de alimento", type: "text", required: true },
      { name: "cantidad_kg_dia", label: "Cantidad kg/día", type: "number" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => String(r.tipo_alimento ?? "Dieta registrada"),
    details: (r) => [formatDate(String(r.fecha_inicio ?? "")), r.cantidad_kg_dia ? `${r.cantidad_kg_dia} kg/día` : "", String(r.notas ?? "")],
  },
  peso: {
    tipo: "peso",
    title: "Peso",
    subtitle: "Pesajes, ganancia y evidencia.",
    table: "pesajes",
    animalField: "animal_id",
    orderField: "fecha",
    icon: Scale,
    evidenceFolder: "pesajes",
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "peso_kg", label: "Peso kg", type: "number", required: true },
      { name: "evidencia_url", label: "Foto / evidencia", type: "file" },
    ],
    primary: (r) => `${r.peso_kg ?? "—"} kg`,
    details: (r) => [formatDate(String(r.fecha ?? "")), r.ganancia_desde_anterior_kg !== null && r.ganancia_desde_anterior_kg !== undefined ? `Ganancia: ${Number(r.ganancia_desde_anterior_kg) > 0 ? "+" : ""}${r.ganancia_desde_anterior_kg} kg` : "", r.evidencia_url ? "Evidencia disponible" : ""],
  },
  partos: {
    tipo: "partos",
    title: "Partos",
    subtitle: "Nacimientos, resultado y cría registrada.",
    table: "partos",
    animalField: "animal_id_madre",
    orderField: "fecha",
    icon: Baby,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "numero_parto", label: "Número de parto", type: "number" },
      { name: "resultado", label: "Resultado", type: "select", required: true, options: [{ value: "vivo", label: "Vivo" }, { value: "muerto", label: "Muerto" }, { value: "aborto", label: "Aborto" }] },
      { name: "sexo_cria", label: "Sexo de la cría", type: "select", options: [{ value: "M", label: "Macho" }, { value: "H", label: "Hembra" }] },
      { name: "cria_id", label: "Cría registrada", type: "animal" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => `Resultado: ${labelFromValue(String(r.resultado ?? ""), "partos")}`,
    details: (r) => [formatDate(String(r.fecha ?? "")), r.numero_parto ? `Parto #${r.numero_parto}` : "", String(r.notas ?? "")],
  },
  chequeo: {
    tipo: "chequeo",
    title: "Chequeo veterinario",
    subtitle: "Revisiones veterinarias y diagnóstico.",
    table: "chequeos_veterinarios",
    animalField: "animal_id",
    orderField: "fecha",
    icon: ClipboardPlus,
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "veterinario", label: "Veterinario", type: "text" },
      { name: "estado", label: "Estado", type: "text" },
      { name: "diagnostico", label: "Diagnóstico", type: "textarea" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => String(r.estado ?? r.diagnostico ?? "Chequeo registrado"),
    details: (r) => [formatDate(String(r.fecha ?? "")), String(r.veterinario ?? ""), String(r.notas ?? "")],
  },
  campeonatos: {
    tipo: "campeonatos",
    title: "Campeonatos",
    subtitle: "Participaciones, resultados y evidencias.",
    table: "campeonatos",
    animalField: "animal_id",
    orderField: "fecha",
    icon: Award,
    evidenceFolder: "campeonatos",
    fields: [
      { name: "fecha", label: "Fecha", type: "date", required: true },
      { name: "nombre", label: "Nombre del campeonato", type: "text", required: true },
      { name: "lugar", label: "Lugar", type: "text" },
      { name: "categoria", label: "Categoría", type: "text" },
      { name: "resultado", label: "Resultado / puesto obtenido", type: "text" },
      { name: "juez", label: "Juez", type: "text" },
      { name: "evidencia_url", label: "Foto / evidencia", type: "file" },
      { name: "notas", label: "Notas", type: "textarea" },
    ],
    primary: (r) => String(r.nombre ?? "Campeonato"),
    details: (r) => [formatDate(String(r.fecha ?? "")), String(r.categoria ?? ""), String(r.resultado ?? ""), r.evidencia_url ? "Evidencia disponible" : ""],
  },
};

export const seguimientoTipos = Object.keys(seguimientoConfigs) as SeguimientoTipo[];

export const formatDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export const labelFromValue = (value: string, tipo: SeguimientoTipo) => {
  const field = seguimientoConfigs[tipo].fields.find((f) => f.options?.some((o) => o.value === value));
  return field?.options?.find((o) => o.value === value)?.label ?? value;
};

export const addDays = (date: string, days: number) => {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};