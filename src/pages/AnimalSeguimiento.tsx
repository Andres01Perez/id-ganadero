import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import BottomTabBar from "@/components/BottomTabBar";
import SeguimientoHeader from "@/components/seguimiento/SeguimientoHeader";
import SeguimientoList from "@/components/seguimiento/SeguimientoList";
import SeguimientoForm from "@/components/seguimiento/SeguimientoForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { seguimientoConfigs, type SeguimientoTipo } from "@/lib/seguimiento-config";

type Animal = { id: string; numero: string; nombre: string | null; tipo: string; finca_id?: string };
type Row = Record<string, unknown>;
type AnimalOption = { id: string; label: string };

const db = supabase as any;

const AnimalSeguimiento = () => {
  const { id, tipo } = useParams<{ id: string; tipo: string }>();
  const navigate = useNavigate();
  const config = tipo && tipo in seguimientoConfigs ? seguimientoConfigs[tipo as SeguimientoTipo] : null;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [animalOptions, setAnimalOptions] = useState<AnimalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const needsAnimalOptions = useMemo(() => config?.fields.some((f) => f.type === "animal") ?? false, [config]);

  const load = async () => {
    if (!id || !config) return;
    setLoading(true);
    const animalRes = await supabase
      .from("animales")
      .select("id, numero, nombre, tipo, finca_id")
      .eq("id", id)
      .maybeSingle();

    if (animalRes.error || !animalRes.data) {
      toast.error("No se encontró el animal");
      navigate("/menu");
      return;
    }

    setAnimal(animalRes.data as Animal);

    const registrosRes = await db
      .from(config.table)
      .select("*")
      .eq(config.animalField, id)
      .order(config.orderField, { ascending: false });

    if (registrosRes.error) {
      toast.error(registrosRes.error.message);
    } else {
      setRows((registrosRes.data ?? []) as Row[]);
    }

    if (needsAnimalOptions) {
      const optsRes = await supabase
        .from("animales")
        .select("id, numero, nombre")
        .order("numero", { ascending: true });
      if (!optsRes.error) {
        setAnimalOptions(
          (optsRes.data ?? []).map((a) => ({
            id: a.id,
            label: `${a.nombre ?? "Sin nombre"} ${a.numero}`,
          }))
        );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!config) {
      navigate(-1);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tipo]);

  const uploadEvidence = async (file: File) => {
    if (!id || !config?.evidenceFolder) return "";
    const path = `${id}/eventos/${config.evidenceFolder}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("animal-fotos").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    return supabase.storage.from("animal-fotos").getPublicUrl(path).data.publicUrl;
  };

  const calculateWeightGain = async (values: Row) => {
    if (!id || config?.tipo !== "peso" || !values.fecha || !values.peso_kg) return values;
    const query = db
      .from("pesajes")
      .select("peso_kg, fecha, id")
      .eq("animal_id", id)
      .lt("fecha", values.fecha)
      .order("fecha", { ascending: false })
      .limit(1);
    const { data } = await query;
    const previous = data?.[0]?.peso_kg;
    return {
      ...values,
      ganancia_desde_anterior_kg: previous === undefined ? null : Number(values.peso_kg) - Number(previous),
    };
  };

  const handleSubmit = async (values: Record<string, string>, file: File | null) => {
    if (!id || !config) return;
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setSaving(true);
    try {
      const payload: Row = { [config.animalField]: id };
      config.fields.forEach((field) => {
        if (field.type === "file") return;
        const value = values[field.name];
        if (value === "" || value === undefined) payload[field.name] = null;
        else if (field.type === "number") payload[field.name] = Number(value);
        else payload[field.name] = value;
      });

      if (file && config.evidenceFolder) payload.evidencia_url = await uploadEvidence(file);
      else if (values.evidencia_url) payload.evidencia_url = values.evidencia_url;

      const finalPayload = await calculateWeightGain(payload);

      if (editing?.id) {
        const { error } = await db.from(config.table).update(finalPayload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Registro actualizado");
      } else {
        const { error } = await db.from(config.table).insert({ ...finalPayload, responsable_id: userRes.user.id });
        if (error) throw error;
        toast.success("Registro creado");
      }

      setMode("list");
      setEditing(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!config || !deleting?.id) return;
    const { error } = await db.from(config.table).delete().eq("id", deleting.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Registro eliminado");
      setDeleting(null);
      load();
    }
  };

  if (!config) return null;

  if (loading || !animal) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const last = rows[0];
  const previous = rows[1];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <SeguimientoHeader animalName={animal.nombre ?? "Sin nombre"} animalNumber={animal.numero} config={config} onBack={() => navigate(`/animal/${id}`)} />

      <main className="px-4 py-4 space-y-4">
        <section className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          {config.note ? <p className="mt-3 text-sm bg-secondary text-secondary-foreground rounded-md p-3">{config.note}</p> : null}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <p className="text-xs text-muted-foreground">Registros</p>
              <p className="text-2xl font-semibold">{rows.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último</p>
              <p className="text-sm font-semibold truncate">{last ? config.primary(last) : "—"}</p>
            </div>
          </div>
          {config.tipo === "peso" ? (
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-secondary rounded-md p-2"><p className="text-xs text-muted-foreground">Último</p><p className="font-semibold">{String(last?.peso_kg ?? "—")} kg</p></div>
              <div className="bg-secondary rounded-md p-2"><p className="text-xs text-muted-foreground">Anterior</p><p className="font-semibold">{String(previous?.peso_kg ?? "—")} kg</p></div>
              <div className="bg-secondary rounded-md p-2"><p className="text-xs text-muted-foreground">Ganancia</p><p className="font-semibold">{String(last?.ganancia_desde_anterior_kg ?? "—")} kg</p></div>
            </div>
          ) : null}
        </section>

        {mode === "form" ? (
          <SeguimientoForm config={config} initialRow={editing} animalOptions={animalOptions} saving={saving} onCancel={() => { setMode("list"); setEditing(null); }} onSubmit={handleSubmit} />
        ) : (
          <>
            <Button className="w-full" onClick={() => { setEditing(null); setMode("form"); }}>
              <Plus className="h-4 w-4" /> Nuevo registro
            </Button>
            <SeguimientoList config={config} rows={rows} onEdit={(row) => { setEditing(row); setMode("form"); }} onDelete={setDeleting} />
          </>
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomTabBar />
    </div>
  );
};

export default AnimalSeguimiento;
