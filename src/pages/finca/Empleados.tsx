import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinca } from "@/contexts/FincaContext";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import EmpleadoForm from "@/components/EmpleadoForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Empleado = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  fecha_ingreso: string | null;
  foto_url: string | null;
};

const Initials = ({ name }: { name: string }) => {
  const init = name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-14 h-14 rounded-full border-[3px] border-gold bg-card flex items-center justify-center shrink-0">
      <span className="text-base font-bold text-gold-deep">{init || "?"}</span>
    </div>
  );
};

const FincaEmpleados = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { fincaActiva } = useFinca();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fallbackBanner = useAppAsset(
    ASSET_KEYS.bannerFincas,
    ASSET_FALLBACKS[ASSET_KEYS.bannerFincas],
  );
  const banner = fincaActiva?.foto_url || fallbackBanner;

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data: links, error: e1 } = await supabase
      .from("empleado_fincas")
      .select("empleado_id")
      .eq("finca_id", fincaActiva.id);
    if (e1) {
      toast.error(e1.message);
      setLoading(false);
      return;
    }
    const ids = (links ?? []).map((l) => l.empleado_id);
    if (ids.length === 0) {
      setEmpleados([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("empleados")
      .select("id, nombre_completo, cedula, fecha_ingreso, foto_url")
      .in("id", ids)
      .eq("activo", true)
      .order("nombre_completo");
    if (error) {
      toast.error(error.message);
      setEmpleados([]);
    } else {
      setEmpleados(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter(
      (e) =>
        e.nombre_completo.toLowerCase().includes(q) ||
        (e.cedula ?? "").toLowerCase().includes(q),
    );
  }, [empleados, query]);

  const openCreate = () => {
    setEditId(null);
    setFormOpen(true);
  };
  const openEdit = (id: string) => {
    if (!isAdmin) return;
    setEditId(id);
    setFormOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <FincaActivaChip />
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={banner} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <button
          onClick={() => navigate("/menu-finca")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-base">
        Empleados
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o cédula"
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {empleados.length === 0
                ? "No hay empleados en esta finca"
                : "Sin resultados"}
            </p>
            {isAdmin && empleados.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 px-6">
                Toca el botón + para agregar el primero.
              </p>
            )}
          </div>
        ) : (
          filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => openEdit(e.id)}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform text-left"
            >
              {e.foto_url ? (
                <img
                  src={e.foto_url}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-[3px] border-gold shrink-0"
                />
              ) : (
                <Initials name={e.nombre_completo} />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-ink leading-tight truncate">
                  {e.nombre_completo}
                </p>
                <p className="text-xs text-muted-foreground tracking-wide">
                  {e.cedula ? `CC ${e.cedula}` : "Sin cédula"}
                  {e.fecha_ingreso ? ` · Ingreso ${e.fecha_ingreso}` : ""}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {isAdmin && (
        <button
          onClick={openCreate}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Agregar"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <EmpleadoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        empleadoId={editId}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default FincaEmpleados;
