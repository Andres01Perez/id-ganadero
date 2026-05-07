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
import PotreroForm, { type PotreroEstado } from "@/components/PotreroForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Potrero = {
  id: string;
  numero: string;
  estado: PotreroEstado;
  notas: string | null;
};

const estadoLabel: Record<PotreroEstado, string> = {
  descargado: "Descargado",
  cargado: "Cargado",
  en_renovacion: "En renovación",
};

const estadoClass: Record<PotreroEstado, string> = {
  descargado: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  cargado: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  en_renovacion: "bg-sky-500/15 text-sky-600 border-sky-500/30",
};

const FincaPotreros = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const { fincaActiva } = useFinca();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [potreros, setPotreros] = useState<Potrero[]>([]);
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
    const { data, error } = await supabase
      .from("potreros")
      .select("id, numero, estado, notas")
      .eq("finca_id", fincaActiva.id)
      .order("numero");
    if (error) {
      toast.error(error.message);
      setPotreros([]);
    } else {
      setPotreros((data ?? []) as Potrero[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return potreros;
    return potreros.filter(
      (p) =>
        p.numero.toLowerCase().includes(q) ||
        (p.notas ?? "").toLowerCase().includes(q),
    );
  }, [potreros, query]);

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
        Potreros
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número o notas"
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {potreros.length === 0 ? "No hay potreros en esta finca" : "Sin resultados"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => openEdit(p.id)}
                className="bg-card rounded-xl p-4 shadow-soft border border-border active:scale-[0.99] transition-transform text-left"
              >
                <p className="text-3xl font-extrabold text-ink leading-none">{p.numero}</p>
                <span
                  className={`mt-2 inline-block text-[10px] uppercase tracking-jps font-semibold border rounded-full px-2 py-0.5 ${estadoClass[p.estado]}`}
                >
                  {estadoLabel[p.estado]}
                </span>
                {p.notas && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.notas}</p>
                )}
              </button>
            ))}
          </div>
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

      <PotreroForm
        open={formOpen}
        onOpenChange={setFormOpen}
        potreroId={editId}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default FincaPotreros;
