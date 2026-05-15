import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sexo: "M" | "H";
  onCreated: (pariente: {
    id: string;
    nombre: string;
    numero: string;
    numero_registro: string;
  }) => void;
};

const ParienteExternoDialog = ({ open, onOpenChange, sexo, onCreated }: Props) => {
  const { user } = useAuth();
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [registro, setRegistro] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre("");
      setNumero("");
      setRegistro("");
    }
  }, [open]);

  const titulo = sexo === "F" ? "Nueva madre externa" : "Nuevo padre externo";

  const handleSave = async () => {
    if (!user) return;
    if (!nombre.trim() || !numero.trim() || !registro.trim()) {
      toast.error("Nombre, número y registro son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("parientes_externos")
        .insert({
          sexo,
          nombre: nombre.trim(),
          numero: numero.trim(),
          numero_registro: registro.trim(),
          created_by: user.id,
        })
        .select("id, nombre, numero, numero_registro")
        .single();
      if (error) throw error;
      toast.success("Pariente externo creado");
      onCreated(data);
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      console.error(err);
      if (e.code === "23505") {
        toast.error("Ya existe un pariente con ese número y sexo");
      } else {
        toast.error(e.message ?? "No se pudo crear");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Registra un animal externo para usarlo como {sexo === "F" ? "madre" : "padre"} en
            la genealogía. Quedará disponible en todas las fincas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="pe-nombre">Nombre *</Label>
            <Input id="pe-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pe-numero">Número *</Label>
            <Input id="pe-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pe-reg">Registro *</Label>
            <Input id="pe-reg" value={registro} onChange={(e) => setRegistro(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold-solid text-ink hover:bg-gold-solid/90"
          >
            {saving ? "Guardando…" : "Guardar y seleccionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParienteExternoDialog;
