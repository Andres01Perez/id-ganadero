import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import { useAuth } from "@/hooks/useAuth";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { formatAuditEvent, TABLA_OPCIONES } from "@/lib/audit-format";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Row = {
  id: string;
  tabla: string;
  accion: string;
  cambios: any;
  usuario_display_name: string | null;
  created_at: string;
};

const PAGE_SIZE = 50;

const RANGOS = [
  { value: "1", label: "Hoy" },
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "0", label: "Todo" },
];

const Movimientos = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabla, setTabla] = useState<string>("all");
  const [rango, setRango] = useState<string>("30");
  const [hasMore, setHasMore] = useState(false);

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("audit_log")
      .select("id, tabla, accion, cambios, usuario_display_name, created_at, finca_id")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);

    // Si no es admin, RLS ya filtra por finca. Si es admin, restringimos a la finca activa.
    if (isAdmin && fincaActiva) {
      q = q.eq("finca_id", fincaActiva.id);
    }
    if (tabla !== "all") q = q.eq("tabla", tabla);
    if (rango !== "0") {
      const dias = parseInt(rango, 10);
      const desde = new Date();
      desde.setDate(desde.getDate() - dias);
      q = q.gte("created_at", desde.toISOString());
    }

    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      const list = (data ?? []) as Row[];
      setHasMore(list.length > PAGE_SIZE);
      setRows(list.slice(0, PAGE_SIZE));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id, tabla, rango]);

  const fmtFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <h1 className="font-semibold uppercase tracking-jps text-sm">Movimientos</h1>
      </header>

      <div className="px-4 py-3 flex gap-2">
        <Select value={tabla} onValueChange={setTabla}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TABLA_OPCIONES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rango} onValueChange={setRango}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGOS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No hay movimientos en este rango</p>
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="bg-card rounded-xl p-3 shadow-soft">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{fmtFecha(r.created_at)}</span>
                <span className="font-medium">{r.usuario_display_name ?? "Sistema"}</span>
              </div>
              <p className="mt-1 text-sm text-ink leading-snug">{formatAuditEvent(r)}</p>
            </div>
          ))
        )}
        {hasMore && (
          <p className="text-center text-xs text-muted-foreground py-3">
            Mostrando los últimos {PAGE_SIZE}. Ajusta los filtros para ver más.
          </p>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Movimientos;
