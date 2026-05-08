import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Unidad = { id: string; nombre: string; abreviatura: string | null };

const NEW = "__new__";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

const UnidadMedidaSelect = ({ value, onChange }: Props) => {
  const { user } = useAuth();
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [internal, setInternal] = useState<string>(value || "");
  const [nuevo, setNuevo] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    setInternal(value || "");
  }, [value]);

  const load = async () => {
    const { data } = await supabase
      .from("unidades_medida")
      .select("id, nombre, abreviatura")
      .order("nombre");
    setUnidades((data ?? []) as Unidad[]);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = (v: string) => {
    setInternal(v);
    if (v !== NEW) onChange(v);
  };

  const handleCrear = async () => {
    if (!user) return;
    const nombre = nuevo.trim();
    if (!nombre) {
      toast.error("Escribe el nombre de la unidad");
      return;
    }
    const existente = unidades.find(
      (u) => u.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (existente) {
      onChange(existente.id);
      setInternal(existente.id);
      setNuevo("");
      return;
    }
    setCreando(true);
    const { data, error } = await supabase
      .from("unidades_medida")
      .insert({ nombre, created_by: user.id })
      .select("id, nombre, abreviatura")
      .single();
    setCreando(false);
    if (error || !data) {
      toast.error(error?.message ?? "No se pudo crear la unidad");
      return;
    }
    setUnidades((prev) =>
      [...prev, data as Unidad].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    );
    onChange(data.id);
    setInternal(data.id);
    setNuevo("");
    toast.success("Unidad creada");
  };

  return (
    <div className="space-y-2">
      <Select value={internal} onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona…" />
        </SelectTrigger>
        <SelectContent>
          {unidades.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nombre}
              {u.abreviatura ? ` (${u.abreviatura})` : ""}
            </SelectItem>
          ))}
          <SelectItem value={NEW}>Otro…</SelectItem>
        </SelectContent>
      </Select>
      {internal === NEW && (
        <div className="flex gap-2">
          <Input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Nueva unidad (ej. Pacas)"
            autoFocus
          />
          <button
            type="button"
            onClick={handleCrear}
            disabled={creando}
            className="px-3 rounded-md bg-gold-solid text-ink text-sm font-semibold disabled:opacity-50"
          >
            {creando ? "…" : "Crear"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UnidadMedidaSelect;
