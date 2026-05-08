import { useEffect, useState } from "react";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const AnimalFincaForm = ({ open, onOpenChange, animalId, onSaved }: Props) => {
  const { user } = useAuth();
  const { fincaActiva } = useFinca();
  const isEdit = !!animalId;

  const [tipo, setTipo] = useState("");
  const [cantidad, setCantidad] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (animalId) {
      (async () => {
        const { data, error } = await supabase
          .from("animales_finca")
          .select("tipo, cantidad")
          .eq("id", animalId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar");
          onOpenChange(false);
          return;
        }
        setTipo(data.tipo ?? "");
        setCantidad(String(data.cantidad ?? 0));
      })();
    } else {
      setTipo("");
      setCantidad("");
    }
  }, [open, animalId, onOpenChange]);

  const handleSubmit = async () => {
    if (!user || !fincaActiva) return;

    const tipoTrim = tipo.trim();
    if (!tipoTrim) {
      toast.error("Escribe el tipo de animal");
      return;
    }
    const cantNum = Number(cantidad);
    if (cantidad === "" || !Number.isFinite(cantNum) || cantNum < 0 || !Number.isInteger(cantNum)) {
      toast.error("Cantidad inválida");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && animalId) {
        const { error } = await supabase
          .from("animales_finca")
          .update({ tipo: tipoTrim, cantidad: cantNum })
          .eq("id", animalId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("animales_finca").insert({
          tipo: tipoTrim,
          cantidad: cantNum,
          finca_id: fincaActiva.id,
          created_by: user.id,
        });
        if (error) throw error;
      }
      toast.success(isEdit ? "Actualizado" : "Creado");
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      console.error(err);
      if (e.code === "23505") {
        toast.error("Ya existe un registro con ese tipo en esta finca");
      } else {
        toast.error(e.message ?? "No se pudo guardar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!animalId) return;
    if (!confirm("¿Eliminar este registro?")) return;
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
    toast.success("Eliminado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[90dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar registro" : "Nuevo registro"}</SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="tipo">Animal *</Label>
            <Input
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej. Caballos, Novillos, Gallinas"
            />
          </div>

          <div>
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              inputMode="numeric"
              min={0}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
            />
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
