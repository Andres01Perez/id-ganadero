import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import {
  exportBloques,
  findBloque,
  type ExportBloque,
  type ExportConfig,
  type BloqueSeleccion,
  type ExportField,
} from "./export-config";

type AnimalLite = {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: string;
  sexo: string | null;
  raza: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  numero_registro: string | null;
  activo: boolean;
  finca_id: string;
  padre_id: string | null;
  madre_id: string | null;
  padre_externo_id: string | null;
  madre_externa_id: string | null;
};

const formatDate = (v: unknown): string => {
  if (!v) return "";
  const s = String(v).slice(0, 10);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return String(v);
  return `${d}/${m}/${y}`;
};

const formatCell = (value: unknown, field: ExportField): string | number | boolean => {
  if (value === null || value === undefined || value === "") return "";
  if (field.type === "date") return formatDate(value);
  if (field.type === "boolean") return value ? "Sí" : "No";
  if (field.type === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? String(value) : n;
  }
  return String(value);
};

/** Pagina toda una tabla en lotes de 1000.
 *  El builder recibe (from, to) y devuelve la query Supabase ya rangeada. */
async function fetchAll<T>(
  builder: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T[]> {
  const PAGE = 1000;
  let from = 0;
  const all: T[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await builder(from, from + PAGE - 1);
    if (error) throw error as Error;
    const chunk = (data ?? []) as T[];
    all.push(...chunk);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }
  return all;
}


async function loadAnimales(fincaIds: string[]): Promise<AnimalLite[]> {
  if (fincaIds.length === 0) return [];
  return fetchAll<AnimalLite>((from, to) =>
    supabase
      .from("animales")
      .select(
        "id, numero, nombre, tipo, sexo, raza, color, fecha_nacimiento, numero_registro, activo, finca_id, padre_id, madre_id, padre_externo_id, madre_externa_id",
      )
      .in("finca_id", fincaIds)
      .order("numero")
      .range(from, to),
  );
}


async function loadFincasMap(fincaIds: string[]): Promise<Map<string, string>> {
  if (fincaIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("fincas")
    .select("id, nombre")
    .in("id", fincaIds);
  if (error) throw error;
  return new Map((data ?? []).map((f) => [f.id, f.nombre]));
}

type ParienteLite = { id: string; numero: string | null; nombre: string | null };
async function loadParientes(animales: AnimalLite[]): Promise<{
  internos: Map<string, ParienteLite>;
  externos: Map<string, ParienteLite>;
}> {
  const internalIds = new Set<string>();
  const externalIds = new Set<string>();
  animales.forEach((a) => {
    if (a.padre_id) internalIds.add(a.padre_id);
    if (a.madre_id) internalIds.add(a.madre_id);
    if (a.padre_externo_id) externalIds.add(a.padre_externo_id);
    if (a.madre_externa_id) externalIds.add(a.madre_externa_id);
  });
  const internos = new Map<string, ParienteLite>();
  const externos = new Map<string, ParienteLite>();
  if (internalIds.size > 0) {
    const { data } = await supabase
      .from("animales")
      .select("id, numero, nombre")
      .in("id", Array.from(internalIds));
    (data ?? []).forEach((r) => internos.set(r.id, r));
  }
  if (externalIds.size > 0) {
    const { data } = await supabase
      .from("parientes_externos")
      .select("id, numero, nombre")
      .in("id", Array.from(externalIds));
    (data ?? []).forEach((r) => externos.set(r.id, r));
  }
  return { internos, externos };
}

const parienteLabel = (p?: ParienteLite | null) => {
  if (!p) return "";
  const nombre = p.nombre ?? "";
  const numero = p.numero ?? "";
  return [nombre, numero].filter(Boolean).join(" · ");
};

function applyAnimalFilters(animales: AnimalLite[], sel: BloqueSeleccion): AnimalLite[] {
  let list = animales;
  if (sel.filtroTipo && sel.filtroTipo !== "todos") {
    list = list.filter((a) => a.tipo === sel.filtroTipo);
  }
  if (sel.filtroActivo && sel.filtroActivo !== "todos") {
    const want = sel.filtroActivo === "si";
    list = list.filter((a) => a.activo === want);
  }
  if (sel.fechaDesde) {
    list = list.filter((a) => a.fecha_nacimiento && a.fecha_nacimiento >= sel.fechaDesde!);
  }
  if (sel.fechaHasta) {
    list = list.filter((a) => a.fecha_nacimiento && a.fecha_nacimiento <= sel.fechaHasta!);
  }
  return list;
}

function buildAnimalRows(
  animales: AnimalLite[],
  campos: string[],
  fincaMap: Map<string, string>,
  internos: Map<string, ParienteLite>,
  externos: Map<string, ParienteLite>,
): Record<string, unknown>[] {
  const block = findBloque("animales")!;
  const fieldDefs = block.fields.filter((f) => campos.includes(f.key));
  return animales.map((a) => {
    const row: Record<string, unknown> = {};
    const fincaNombre = fincaMap.get(a.finca_id) ?? "";
    const padreLabel =
      parienteLabel(a.padre_id ? internos.get(a.padre_id) : null) ||
      parienteLabel(a.padre_externo_id ? externos.get(a.padre_externo_id) : null);
    const madreLabel =
      parienteLabel(a.madre_id ? internos.get(a.madre_id) : null) ||
      parienteLabel(a.madre_externa_id ? externos.get(a.madre_externa_id) : null);
    fieldDefs.forEach((f) => {
      let raw: unknown;
      if (f.key === "finca_nombre") raw = fincaNombre;
      else if (f.key === "padre_label") raw = padreLabel;
      else if (f.key === "madre_label") raw = madreLabel;
      else raw = (a as unknown as Record<string, unknown>)[f.key];
      row[f.label] = formatCell(raw, f);
    });
    return row;
  });
}

async function fetchSeguimientoRows(
  block: ExportBloque,
  sel: BloqueSeleccion,
  animalesAccesibles: AnimalLite[],
): Promise<Record<string, unknown>[]> {
  if (animalesAccesibles.length === 0) return [];
  const animalMap = new Map(animalesAccesibles.map((a) => [a.id, a]));
  const ids = Array.from(animalMap.keys());
  // determinar campo animal_id (usa orderField/fechaField defaults)
  const animalField =
    block.table === "partos" ? "animal_id_madre" :
    block.table === "embriones_recolectados" ? "animal_id_donadora" :
    "animal_id";

  // fetch en chunks de 200 ids para no exceder URL
  const CHUNK = 200;
  const collected: Record<string, unknown>[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const rows = await fetchAll<Record<string, unknown>>((from, to) => {
      let q = sb.from(block.table).select("*").in(animalField, slice);
      if (block.fechaField && sel.fechaDesde) q = q.gte(block.fechaField, sel.fechaDesde);
      if (block.fechaField && sel.fechaHasta) q = q.lte(block.fechaField, sel.fechaHasta);
      return q
        .order(block.fechaField ?? "created_at", { ascending: false })
        .range(from, to);
    });
    collected.push(...rows);
  }


  const fieldDefs = block.fields.filter((f) => sel.campos.includes(f.key));
  return collected.map((r) => {
    const animal = animalMap.get(String(r[animalField] ?? ""));
    const out: Record<string, unknown> = {};
    fieldDefs.forEach((f) => {
      let raw: unknown;
      if (f.key === "animal_numero") raw = animal?.numero ?? "";
      else if (f.key === "animal_nombre") raw = animal?.nombre ?? "";
      else raw = r[f.key];
      out[f.label] = formatCell(raw, f);
    });
    return out;
  });
}

async function fetchPotrerosRows(
  block: ExportBloque,
  sel: BloqueSeleccion,
  fincaIds: string[],
  fincaMap: Map<string, string>,
): Promise<Record<string, unknown>[]> {
  if (fincaIds.length === 0) return [];
  const rows = await fetchAll<Record<string, unknown>>((from, to) =>
    supabase.from("potreros").select("*").in("finca_id", fincaIds).order("numero").range(from, to),
  );

  const fieldDefs = block.fields.filter((f) => sel.campos.includes(f.key));
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    fieldDefs.forEach((f) => {
      let raw: unknown;
      if (f.key === "finca_nombre") raw = fincaMap.get(String(r.finca_id ?? "")) ?? "";
      else raw = r[f.key];
      out[f.label] = formatCell(raw, f);
    });
    return out;
  });
}

async function fetchEmpleadosRows(
  block: ExportBloque,
  sel: BloqueSeleccion,
  fincaIds: string[],
  fincaMap: Map<string, string>,
): Promise<Record<string, unknown>[]> {
  if (fincaIds.length === 0) return [];
  const { data: links, error: linkErr } = await supabase
    .from("empleado_fincas")
    .select("empleado_id, finca_id")
    .in("finca_id", fincaIds);
  if (linkErr) throw linkErr;
  const empleadoFincaMap = new Map<string, Set<string>>();
  (links ?? []).forEach((l) => {
    const set = empleadoFincaMap.get(l.empleado_id) ?? new Set<string>();
    set.add(l.finca_id);
    empleadoFincaMap.set(l.empleado_id, set);
  });
  const empleadoIds = Array.from(empleadoFincaMap.keys());
  if (empleadoIds.length === 0) return [];
  const empleados = await fetchAll<Record<string, unknown>>((from, to) =>
    supabase.from("empleados").select("*").in("id", empleadoIds).order("nombre_completo").range(from, to),
  );

  const fieldDefs = block.fields.filter((f) => sel.campos.includes(f.key));
  return empleados.map((e) => {
    const out: Record<string, unknown> = {};
    const fincaNames = Array.from(empleadoFincaMap.get(String(e.id)) ?? [])
      .map((fid) => fincaMap.get(fid))
      .filter(Boolean)
      .join(", ");
    fieldDefs.forEach((f) => {
      let raw: unknown;
      if (f.key === "fincas") raw = fincaNames;
      else raw = e[f.key];
      out[f.label] = formatCell(raw, f);
    });
    return out;
  });
}

export type ExportResult = {
  sheets: Array<{ name: string; rowCount: number }>;
};

export async function exportarConfiguracion(
  config: ExportConfig,
  fileBaseName = "exportacion-jps",
): Promise<ExportResult> {
  const wb = XLSX.utils.book_new();
  const sheetsInfo: ExportResult["sheets"] = [];

  const fincaMap = await loadFincasMap(config.fincaIds);

  // Animales accesibles para joins en seguimientos
  const necesitaAnimales = config.bloques.some((b) => {
    const blk = findBloque(b.key);
    return blk?.porAnimal || b.key === "animales";
  });
  let animales: AnimalLite[] = [];
  let internos = new Map<string, ParienteLite>();
  let externos = new Map<string, ParienteLite>();
  if (necesitaAnimales) {
    animales = await loadAnimales(config.fincaIds);
    if (config.bloques.some((b) => b.key === "animales")) {
      ({ internos, externos } = await loadParientes(animales));
    }
  }

  for (const sel of config.bloques) {
    const block = findBloque(sel.key);
    if (!block || sel.campos.length === 0) continue;

    let rows: Record<string, unknown>[] = [];

    if (block.key === "animales") {
      const filtrados = applyAnimalFilters(animales, sel);
      rows = buildAnimalRows(filtrados, sel.campos, fincaMap, internos, externos);
    } else if (block.porAnimal) {
      rows = await fetchSeguimientoRows(block, sel, animales);
    } else if (block.key === "potreros") {
      rows = await fetchPotrerosRows(block, sel, config.fincaIds, fincaMap);
    } else if (block.key === "empleados") {
      rows = await fetchEmpleadosRows(block, sel, config.fincaIds, fincaMap);
    }

    const headerLabels = block.fields
      .filter((f) => sel.campos.includes(f.key))
      .map((f) => f.label);
    const ws =
      rows.length > 0
        ? XLSX.utils.json_to_sheet(rows, { header: headerLabels })
        : XLSX.utils.aoa_to_sheet([headerLabels]);
    XLSX.utils.book_append_sheet(wb, ws, block.sheetName.slice(0, 31));
    sheetsInfo.push({ name: block.sheetName, rowCount: rows.length });
  }

  if (sheetsInfo.length === 0) {
    throw new Error("No hay datos para exportar con la selección actual");
  }

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileBaseName}-${stamp}.xlsx`);
  return { sheets: sheetsInfo };
}

export { exportBloques };
