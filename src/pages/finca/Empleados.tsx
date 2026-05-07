import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, User, Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import EmpleadoForm from "@/components/EmpleadoForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { calcularEdad, esCumpleHoy } from "@/lib/empleado-utils";

type Empleado = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  fecha_ingreso: string | null;
  fecha_nacimiento: string | null;
  foto_url: string | null;
  activo: boolean;
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
      .select("id, nombre_completo, cedula, fecha_ingreso, fecha_nacimiento, foto_url, activo")
      .in("id", ids)
      .order("nombre_completo");
    if (error) {
      toast.error(error.message);
      setEmpleados([]);
    } else {
      const list = (data ?? []) as Empleado[];
      // activos primero
      list.sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        return a.nombre_completo.localeCompare(b.nombre_completo);
      });
      setEmpleados(list);
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
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate("/menu-finca")}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">Empleados</span>
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
          filtered.map((e) => {
            const edad = calcularEdad(e.fecha_nacimiento);
            const cumple = esCumpleHoy(e.fecha_nacimiento);
            const inactivo = !e.activo;
            return (
              <button
                key={e.id}
                onClick={() => openEdit(e.id)}
                className={`w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform text-left ${
                  inactivo ? "opacity-40 grayscale" : ""
                }`}
              >
                <div className="w-14 h-14 rounded-full border-[3px] border-gold bg-card overflow-hidden flex items-center justify-center shrink-0">
                  {e.foto_url ? (
                    <img src={e.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-gold-deep" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-base text-ink leading-tight truncate">
                      {e.nombre_completo}
                    </p>
                    {inactivo && (
                      <span className="text-[10px] uppercase tracking-jps font-semibold border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                    {cumple && !inactivo && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-jps font-semibold rounded-full px-2 py-0.5 bg-gold-solid text-ink">
                        <Cake className="h-3 w-3" /> Cumpleaños
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    {e.cedula ? `CC ${e.cedula}` : "Sin cédula"}
                    {edad !== null ? ` · ${edad} años` : ""}
                  </p>
                </div>
              </button>
            );
          })
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
