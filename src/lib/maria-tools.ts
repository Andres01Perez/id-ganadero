import { supabase } from "@/integrations/supabase/client";

type AnimalSummary = {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: string;
  sexo: string | null;
  raza: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  finca_id: string;
  fincas?: { nombre: string | null } | null;
};

type ToolParams = Record<string, unknown>;

const asText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const asLimit = (value: unknown, fallback = 10) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), 25) : fallback;
};

const ageFromDate = (date: string | null) => {
  if (!date) return null;
  const birth = new Date(`${date}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  if (years === 0) return `${restMonths} meses`;
  if (restMonths === 0) return `${years} años`;
  return `${years} años y ${restMonths} meses`;
};

const formatAnimal = (animal: AnimalSummary) => ({
  id: animal.id,
  numero: animal.numero,
  nombre: animal.nombre,
  tipo: animal.tipo,
  sexo: animal.sexo === "M" ? "Macho" : animal.sexo === "H" ? "Hembra" : null,
  raza: animal.raza,
  color: animal.color,
  fecha_nacimiento: animal.fecha_nacimiento,
  edad_aproximada: ageFromDate(animal.fecha_nacimiento),
  finca: animal.fincas?.nombre ?? null,
});

const result = (payload: unknown) => JSON.stringify(payload, null, 2);
const fail = (message: string) => result({ error: message });

export const mariaClientTools = {
  buscar_animales: async (params: ToolParams = {}) => {
    const texto = asText(params.texto ?? params.busqueda ?? params.query);
    const tipo = asText(params.tipo).toLowerCase();
    const finca = asText(params.finca);
    const raza = asText(params.raza);
    const color = asText(params.color);
    const limit = asLimit(params.limite ?? params.limit);

    let query = supabase
      .from("animales")
      .select("id, numero, nombre, tipo, sexo, raza, color, fecha_nacimiento, finca_id, fincas(nombre)")
      .eq("activo", true)
      .order("numero", { ascending: true })
      .limit(limit);

    if (texto) {
      const safe = texto.replace(/[%(),]/g, " ").trim();
      query = query.or(`numero.ilike.%${safe}%,nombre.ilike.%${safe}%`);
    }
    if (["macho", "hembra", "cria", "embrion", "otro"].includes(tipo)) {
      query = query.eq("tipo", tipo as "macho" | "hembra" | "cria" | "embrion" | "otro");
    }
    if (raza) query = query.ilike("raza", raza);
    if (color) query = query.ilike("color", color);
    if (finca) query = query.ilike("fincas.nombre", `%${finca}%`);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const animales = ((data ?? []) as AnimalSummary[]).map(formatAnimal);
    return result({ total: animales.length, animales });
  },

  detalle_animal: async (params: ToolParams = {}) => {
    const id = asText(params.id ?? params.animal_id);
    const numero = asText(params.numero);
    const nombre = asText(params.nombre);

    let query = supabase
      .from("animales")
      .select(
        "id, numero, nombre, tipo, sexo, raza, color, fecha_nacimiento, numero_registro, madre_id, padre_id, finca_id, fincas(nombre)",
      )
      .eq("activo", true)
      .limit(1);

    if (id) query = query.eq("id", id);
    else if (numero) query = query.eq("numero", numero);
    else if (nombre) query = query.ilike("nombre", `%${nombre}%`);
    else return fail("Indica número, nombre o id del animal.");

    const { data, error } = await query;
    if (error) return fail(error.message);
    const animal = data?.[0] as (AnimalSummary & { numero_registro?: string | null; madre_id?: string | null; padre_id?: string | null }) | undefined;
    if (!animal) return result({ encontrado: false });

    const parentIds = [animal.madre_id, animal.padre_id].filter(Boolean) as string[];
    const parents = parentIds.length
      ? await supabase.from("animales").select("id, numero, nombre, tipo").in("id", parentIds)
      : { data: [] };

    return result({
      encontrado: true,
      animal: {
        ...formatAnimal(animal),
        numero_registro: animal.numero_registro ?? null,
        madre: parents.data?.find((p) => p.id === animal.madre_id) ?? null,
        padre: parents.data?.find((p) => p.id === animal.padre_id) ?? null,
      },
    });
  },

  consultar_pesajes: async (params: ToolParams = {}) => {
    const animalId = asText(params.animal_id ?? params.id);
    const numero = asText(params.numero);
    const limit = asLimit(params.limite ?? params.limit, 5);
    let resolvedId = animalId;

    if (!resolvedId && numero) {
      const { data, error } = await supabase.from("animales").select("id, numero, nombre").eq("numero", numero).eq("activo", true).maybeSingle();
      if (error) return fail(error.message);
      if (!data) return result({ encontrado: false });
      resolvedId = data.id;
    }
    if (!resolvedId) return fail("Indica número o id del animal.");

    const { data, error } = await supabase
      .from("pesajes")
      .select("fecha, peso_kg, ganancia_desde_anterior_kg")
      .eq("animal_id", resolvedId)
      .order("fecha", { ascending: false })
      .limit(limit);

    if (error) return fail(error.message);
    return result({ total: data?.length ?? 0, pesajes: data ?? [] });
  },

  consultar_reproduccion: async (params: ToolParams = {}) => {
    const animalId = asText(params.animal_id ?? params.id);
    const numero = asText(params.numero);
    let resolvedId = animalId;

    if (!resolvedId && numero) {
      const { data, error } = await supabase.from("animales").select("id").eq("numero", numero).eq("activo", true).maybeSingle();
      if (error) return fail(error.message);
      if (!data) return result({ encontrado: false });
      resolvedId = data.id;
    }
    if (!resolvedId) return fail("Indica número o id del animal.");

    const [palpaciones, inseminaciones, partos, embriones] = await Promise.all([
      supabase.from("palpaciones").select("fecha, resultado, tiempo_prenez_dias, notas").eq("animal_id", resolvedId).order("fecha", { ascending: false }).limit(5),
      supabase.from("inseminaciones").select("fecha, metodo, toro_externo_nombre, toro_id, notas").eq("animal_id", resolvedId).order("fecha", { ascending: false }).limit(5),
      supabase.from("partos").select("fecha, resultado, numero_parto, sexo_cria, notas").eq("animal_id_madre", resolvedId).order("fecha", { ascending: false }).limit(5),
      supabase.from("embriones_recolectados").select("fecha, cantidad, calidad, notas").eq("animal_id_donadora", resolvedId).order("fecha", { ascending: false }).limit(5),
    ]);

    const error = palpaciones.error || inseminaciones.error || partos.error || embriones.error;
    if (error) return fail(error.message);

    return result({
      palpaciones: palpaciones.data ?? [],
      inseminaciones: inseminaciones.data ?? [],
      partos: partos.data ?? [],
      embriones_recolectados: embriones.data ?? [],
    });
  },

  resumen_ganaderia: async () => {
    const [{ data: animales, error: animalesError }, { data: fincas, error: fincasError }] = await Promise.all([
      supabase.from("animales").select("tipo, finca_id").eq("activo", true),
      supabase.from("fincas").select("id, nombre").eq("activo", true),
    ]);

    if (animalesError) return fail(animalesError.message);
    if (fincasError) return fail(fincasError.message);

    const porTipo = (animales ?? []).reduce<Record<string, number>>((acc, animal) => {
      acc[animal.tipo] = (acc[animal.tipo] ?? 0) + 1;
      return acc;
    }, {});
    const fincaNames = new Map((fincas ?? []).map((f) => [f.id, f.nombre]));
    const porFinca = (animales ?? []).reduce<Record<string, number>>((acc, animal) => {
      const name = fincaNames.get(animal.finca_id) ?? "Sin finca";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    return result({ total: animales?.length ?? 0, por_tipo: porTipo, por_finca: porFinca });
  },
};
