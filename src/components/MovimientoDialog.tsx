import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoId: string;
  productoNombre: string;
  tipo: "entrada" | "salida";
  stockActual: number;
  unidadAbrev: string;
  onSaved?: () => void | Promise<void>;
};

const MovimientoDialog = ({
  open,
  onOpenChange,
  productoId,
  productoNombre,
  tipo,
  stockActual,
  unidadAbrev,
  onSaved,
}: Props) => {
  const { user } = useAuth();
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCantidad("");
      setFecha(new Date().toISOString().slice(0, 10));
      setNotas("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;
    const cant = Number(cantidad);
    if (!cant || cant <= 0) {
      toast.error("Cantidad debe ser mayor a 0");
      return;
    }
    if (tipo === "salida" && cant > stockActual) {
      toast.error(`No hay suficiente stock (disponible: ${stockActual})`);
      return;
    }
    if (!fecha) {
      toast.error("Fecha obligatoria");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("inventario_movimientos").insert({
      producto_id: productoId,
      tipo,
      cantidad: cant,
      fecha,
      notas: notas.trim() || null,
      responsable_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(tipo === "entrada" ? "Entrada registrada" : "Salida registrada");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {tipo === "entrada" ? "Registrar entrada" : "Registrar salida"}
          </SheetTitle>
          <SheetDescription>
            {productoNombre} · stock actual: {stockActual} {unidadAbrev}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="cant">Cantidad *</Label>
            <Input
              id="cant"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="fec">Fecha *</Label>
            <Input
              id="fec"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="not">Notas</Label>
            <Textarea
              id="not"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MovimientoDialog;
