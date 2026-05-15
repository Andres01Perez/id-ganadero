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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PotreroEstado = "descargado" | "cargado" | "en_renovacion";

const ESTADOS: { value: PotreroEstado; label: string }[] = [
  { value: "descargado", label: "Descargado" },
  { value: "cargado", label: "Cargado" },
  { value: "en_renovacion", label: "En renovación" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  potreroId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const schema = z.object({
  numero: z.string().trim().min(1, "Número obligatorio").max(40),
  estado: z.enum(["descargado", "cargado", "en_renovacion"]),
  hectareas: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 99999),
      { message: "Hectáreas debe ser un número entre 0 y 99999" },
    ),
  notas: z.string().max(500).optional().or(z.literal("")),
});

const PotreroForm = ({ open, onOpenChange, potreroId, onSaved }: Props) => {
  const { user } = useAuth();
  const { fincaActiva } = useFinca();
  const isEdit = !!potreroId;

  const [numero, setNumero] = useState("");
  const [estado, setEstado] = useState<PotreroEstado>("descargado");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (potreroId) {
      (async () => {
        const { data, error } = await supabase
          .from("potreros")
          .select("*")
          .eq("id", potreroId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar el potrero");
          onOpenChange(false);
          return;
        }
        setNumero(data.numero ?? "");
        setEstado((data.estado as PotreroEstado) ?? "descargado");
        setNotas(data.notas ?? "");
      })();
    } else {
      setNumero("");
      setEstado("descargado");
      setNotas("");
    }
  }, [open, potreroId, onOpenChange]);

  const handleSubmit = async () => {
    if (!user || !fincaActiva) {
      toast.error("Sesión inválida");
      return;
    }
    const parsed = schema.safeParse({ numero, estado, notas });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && potreroId) {
        const { error } = await supabase
          .from("potreros")
          .update({
            numero: parsed.data.numero,
            estado: parsed.data.estado,
            notas: parsed.data.notas || null,
          })
          .eq("id", potreroId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("potreros").insert({
          numero: parsed.data.numero,
          estado: parsed.data.estado,
          notas: parsed.data.notas || null,
          finca_id: fincaActiva.id,
          created_by: user.id,
        });
        if (error) throw error;
      }
      toast.success(isEdit ? "Potrero actualizado" : "Potrero creado");
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
    if (!potreroId) return;
    if (!confirm("¿Eliminar este potrero?")) return;
    setDeleting(true);
    const { error } = await supabase.from("potreros").delete().eq("id", potreroId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Potrero eliminado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar potrero" : "Nuevo potrero"}</SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="num">Número *</Label>
            <Input id="num" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej. 12" />
          </div>
          <div>
            <Label>Estado *</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as PotreroEstado)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
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

export default PotreroForm;
