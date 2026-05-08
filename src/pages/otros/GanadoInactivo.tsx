import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import AnimalAvatar from "@/components/AnimalAvatar";
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
import { toast } from "sonner";

type Animal = {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: string;
  foto_principal_url: string | null;
};

const tipoLabel: Record<string, string> = {
  macho: "Macho",
  hembra: "Hembra",
  cria: "Cría",
  embrion: "Embrión",
};

const GanadoInactivo = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Animal | null>(null);

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animales")
      .select("id, numero, nombre, tipo, foto_principal_url")
      .eq("finca_id", fincaActiva.id)
      .eq("activo", false)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setAnimals(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const reactivar = async () => {
    if (!target) return;
    const { error } = await supabase
      .from("animales")
      .update({ activo: true })
      .eq("id", target.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${target.nombre ?? target.numero} reactivado`);
      setTarget(null);
      load();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <header className="bg-gold-solid text-ink px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/otros")}
          className="h-9 w-9 rounded-full bg-black/10 flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-semibold uppercase tracking-jps text-sm">Ganado Inactivo</h1>
      </header>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : animals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No hay animales inactivos</p>
          </div>
        ) : (
          animals.map((a) => (
            <div
              key={a.id}
              className="w-full flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft"
            >
              <AnimalAvatar src={a.foto_principal_url} alt={a.nombre ?? a.numero} />
              <div className="flex-1 text-left">
                <p className="font-bold text-base text-ink leading-tight">
                  {a.nombre ?? "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground tracking-wide">
                  {a.numero} · {tipoLabel[a.tipo] ?? a.tipo}
                </p>
              </div>
              <button
                onClick={() => setTarget(a)}
                className="bg-gold-solid text-ink rounded-full py-2 px-3 text-xs font-semibold uppercase tracking-wider shadow-gold active:scale-95 transition-transform flex items-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reactivar
              </button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar animal?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.nombre ?? target?.numero} volverá a aparecer en la lista activa de su categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={reactivar}>Reactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomTabBar />
    </div>
  );
};

export default GanadoInactivo;
