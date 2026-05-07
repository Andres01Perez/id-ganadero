import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import AnimalAvatar from "@/components/AnimalAvatar";
import AnimalForm from "@/components/AnimalForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type AnimalTipo = "macho" | "hembra" | "cria" | "embrion";
type Tab = "todos" | AnimalTipo;

type Animal = {
  id: string;
  numero: string;
  nombre: string | null;
  foto_principal_url: string | null;
  tipo: AnimalTipo | "otro";
};

const TABS: { value: Tab; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "macho", label: "Machos" },
  { value: "hembra", label: "Hembras" },
  { value: "cria", label: "Crías" },
  { value: "embrion", label: "Embriones" },
];

const tipoBadge: Record<string, string> = {
  macho: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  hembra: "bg-pink-500/15 text-pink-600 border-pink-500/30",
  cria: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  embrion: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  otro: "bg-muted text-muted-foreground border-border",
};

const FincaAnimales = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("todos");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [createTipo, setCreateTipo] = useState<AnimalTipo>("hembra");
  const [pickerOpen, setPickerOpen] = useState(false);

  const fallbackBanner = useAppAsset(
    ASSET_KEYS.bannerFincas,
    ASSET_FALLBACKS[ASSET_KEYS.bannerFincas],
  );
  const banner = fincaActiva?.foto_url || fallbackBanner;

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animales")
      .select("id, numero, nombre, foto_principal_url, tipo")
      .eq("finca_id", fincaActiva.id)
      .eq("activo", true)
      .order("numero");
    if (error) {
      toast.error(error.message);
      setAnimals([]);
    } else {
      setAnimals((data ?? []) as Animal[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { todos: animals.length, macho: 0, hembra: 0, cria: 0, embrion: 0 };
    for (const a of animals) {
      if (a.tipo in c) c[a.tipo as Tab]++;
    }
    return c;
  }, [animals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return animals.filter((a) => {
      if (tab !== "todos" && a.tipo !== tab) return false;
      if (!q) return true;
      return (
        a.numero.toLowerCase().includes(q) ||
        (a.nombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [animals, tab, query]);

  const handleFab = () => {
    if (tab === "todos") {
      setPickerOpen(true);
    } else {
      setCreateTipo(tab);
      setFormOpen(true);
    }
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
        Animales de la finca
      </div>

      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número o nombre"
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tracking-jps uppercase border transition-colors ${
                  active
                    ? "bg-gold-solid text-ink border-gold"
                    : "bg-card text-foreground border-border"
                }`}
              >
                {t.label} ({counts[t.value]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No hay animales</p>
          </div>
        ) : (
          filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/animal/${a.id}`)}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform text-left"
            >
              <AnimalAvatar src={a.foto_principal_url} alt={a.nombre ?? a.numero} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-ink leading-tight truncate">
                  {a.nombre ?? "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground tracking-wide">{a.numero}</p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-jps font-semibold border rounded-full px-2 py-0.5 ${tipoBadge[a.tipo] ?? tipoBadge.otro}`}
              >
                {a.tipo}
              </span>
            </button>
          ))
        )}
      </div>

      <button
        onClick={handleFab}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label="Agregar"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Picker simple cuando estamos en "Todos" */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex items-end"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="w-full bg-card rounded-t-2xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-center mb-2">¿Qué tipo de animal?</p>
            {(["macho", "hembra", "cria", "embrion"] as AnimalTipo[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setCreateTipo(t);
                  setPickerOpen(false);
                  setFormOpen(true);
                }}
                className="w-full bg-background border border-border rounded-lg py-3 text-sm font-semibold uppercase tracking-jps active:scale-[0.99]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tipo={createTipo}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default FincaAnimales;
