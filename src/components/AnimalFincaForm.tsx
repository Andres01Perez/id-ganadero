import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinca } from "@/contexts/FincaContext";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tipo = { id: string; nombre: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const NEW_TIPO = "__new__";

const schema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(80),
  tipo_id: z.string().uuid("Selecciona un tipo"),
  edad: z.number().int().min(0).max(100).optional().nullable(),
  fecha_ingreso: z.string().optional().or(z.literal("")),
  fecha_salida: z.string().optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
  activo: z.boolean(),
});

const AnimalFincaForm = ({ open, onOpenChange, animalId, onSaved }: Props) => {
  const { user, roles } = useAuth();
  const { fincaActiva } = useFinca();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isEdit = !!animalId;

  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [tipoId, setTipoId] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<string>("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("tipos_animal_finca")
        .select("id, nombre")
        .order("nombre");
      setTipos((data ?? []) as Tipo[]);
    })();
    if (animalId) {
      (async () => {
        const { data, error } = await supabase
          .from("animales_finca")
          .select("*")
          .eq("id", animalId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar");
          onOpenChange(false);
          return;
        }
        setNombre(data.nombre ?? "");
        setTipoId(data.tipo_id ?? "");
        setEdad(data.edad != null ? String(data.edad) : "");
        setFechaIngreso(data.fecha_ingreso ?? "");
        setFechaSalida(data.fecha_salida ?? "");
        setNotas(data.notas ?? "");
        setActivo(!!data.activo);
      })();
    } else {
      setNombre("");
      setTipoId("");
      setNuevoTipo("");
      setEdad("");
      setFechaIngreso("");
      setFechaSalida("");
      setNotas("");
      setActivo(true);
    }
  }, [open, animalId, onOpenChange]);

  const handleActivoChange = (v: boolean) => {
    setActivo(v);
    if (!v && !fechaSalida) {
      setFechaSalida(new Date().toISOString().slice(0, 10));
    } else if (v) {
      setFechaSalida("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !fincaActiva) return;

    let finalTipoId = tipoId;
    if (tipoId === NEW_TIPO) {
      if (!isAdmin) {
        toast.error("Solo administradores pueden crear tipos");
        return;
      }
      const nombreT = nuevoTipo.trim();
      if (!nombreT) {
        toast.error("Ingresa el nombre del nuevo tipo");
        return;
      }
      const { data: t, error: te } = await supabase
        .from("tipos_animal_finca")
        .insert({ nombre: nombreT, created_by: user.id })
        .select("id")
        .single();
      if (te || !t) {
        toast.error(te?.message ?? "No se pudo crear el tipo");
        return;
      }
      finalTipoId = t.id;
    }

    const parsed = schema.safeParse({
      nombre,
      tipo_id: finalTipoId,
      edad: edad === "" ? null : Number(edad),
      fecha_ingreso: fechaIngreso,
      fecha_salida: fechaSalida,
      notas,
      activo,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: parsed.data.nombre,
        tipo_id: parsed.data.tipo_id,
        edad: parsed.data.edad ?? null,
        fecha_ingreso: parsed.data.fecha_ingreso || null,
        fecha_salida: parsed.data.fecha_salida || null,
        notas: parsed.data.notas || null,
        activo: parsed.data.activo,
      };
      if (isEdit && animalId) {
        const { error } = await supabase
          .from("animales_finca")
          .update(payload)
          .eq("id", animalId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("animales_finca").insert({
          ...payload,
          finca_id: fincaActiva.id,
          created_by: user.id,
        });
        if (error) throw error;
      }
      toast.success(isEdit ? "Animal actualizado" : "Animal creado");
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string };
      console.error(err);
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!animalId) return;
    if (!confirm("¿Eliminar este animal?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("animales_finca")
      .delete()
      .eq("id", animalId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Animal eliminado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar animal" : "Nuevo animal"}</SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Lucero" />
          </div>

          <div>
            <Label>Tipo *</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona…" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
                {isAdmin && (
                  <SelectItem value={NEW_TIPO}>+ Nuevo tipo…</SelectItem>
                )}
              </SelectContent>
            </Select>
            {tipoId === NEW_TIPO && (
              <Input
                className="mt-2"
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                placeholder="Ej. Caballo, Perro, Gallina"
              />
            )}
          </div>

          <div>
            <Label htmlFor="edad">Edad (años)</Label>
            <Input
              id="edad"
              type="number"
              inputMode="numeric"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fi">Fecha ingreso</Label>
              <Input id="fi" type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fs">Fecha salida</Label>
              <Input id="fs" type="date" value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Activo</Label>
              <p className="text-xs text-muted-foreground">
                Desactivar registra la fecha de salida.
              </p>
            </div>
            <Switch checked={activo} onCheckedChange={handleActivoChange} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
            {isEdit && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "…" : "Eliminar"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AnimalFincaForm;
