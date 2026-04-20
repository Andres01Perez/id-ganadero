import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fincaId?: string | null;
  onSaved?: () => void;
};

const schema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(80),
  ubicacion: z.string().trim().max(120).optional().or(z.literal("")),
  hectareas: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), "Hectáreas debe ser numérico"),
});

const FincaForm = ({ open, onOpenChange, fincaId, onSaved }: Props) => {
  const isEdit = !!fincaId;
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (fincaId) {
      (async () => {
        const { data, error } = await supabase
          .from("fincas")
          .select("*")
          .eq("id", fincaId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar la finca");
          onOpenChange(false);
          return;
        }
        setNombre(data.nombre);
        setUbicacion(data.ubicacion ?? "");
        setHectareas(data.hectareas != null ? String(data.hectareas) : "");
      })();
    } else {
      setNombre("");
      setUbicacion("");
      setHectareas("");
    }
  }, [open, fincaId, onOpenChange]);

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ nombre, ubicacion, hectareas });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSubmitting(true);
    const payload = {
      nombre: parsed.data.nombre,
      ubicacion: parsed.data.ubicacion || null,
      hectareas: parsed.data.hectareas ? Number(parsed.data.hectareas) : null,
    };
    const { error } =
      isEdit && fincaId
        ? await supabase.from("fincas").update(payload).eq("id", fincaId)
        : await supabase.from("fincas").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isEdit ? "Finca actualizada" : "Finca creada");
    onSaved?.();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!fincaId) return;
    if (!confirm("¿Desactivar esta finca?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("fincas")
      .update({ activo: false })
      .eq("id", fincaId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo desactivar");
      return;
    }
    toast.success("Finca desactivada");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar finca" : "Nueva finca"}</SheetTitle>
          <SheetDescription>Datos generales de la finca.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="f-nombre">Nombre *</Label>
            <Input
              id="f-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. La Esperanza"
            />
          </div>
          <div>
            <Label htmlFor="f-ubic">Ubicación</Label>
            <Input
              id="f-ubic"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Vereda, municipio…"
            />
          </div>
          <div>
            <Label htmlFor="f-hect">Hectáreas</Label>
            <Input
              id="f-hect"
              type="number"
              step="0.01"
              min="0"
              value={hectareas}
              onChange={(e) => setHectareas(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gold-solid text-ink hover:bg-gold-solid/90 h-12 text-base font-semibold"
            >
              {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? "…" : "Desactivar"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FincaForm;
