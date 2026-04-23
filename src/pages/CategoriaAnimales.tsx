import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";

import BottomTabBar from "@/components/BottomTabBar";
import AnimalForm from "@/components/AnimalForm";
import AnimalAvatar from "@/components/AnimalAvatar";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

type Animal = {
  id: string;
  numero: string;
  nombre: string | null;
  foto_principal_url: string | null;
};

const titles: Record<string, string> = {
  macho: "Machos",
  hembra: "Hembras",
  cria: "Crías",
  embrion: "Embriones",
};

const CategoriaAnimales = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const navigate = useNavigate();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const validTipo = (tipo && tipo in titles ? tipo : "hembra") as
    | "macho"
    | "hembra"
    | "cria"
    | "embrion";
  const title = titles[validTipo];
  const bannerKeyMap = {
    macho: ASSET_KEYS.bannerMachos,
    hembra: ASSET_KEYS.bannerHembras,
    cria: ASSET_KEYS.bannerCrias,
    embrion: ASSET_KEYS.bannerEmbriones,
  } as const;
  const bannerKey = bannerKeyMap[validTipo];
  const headerImg = useAppAsset(bannerKey, ASSET_FALLBACKS[bannerKey]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("animales")
      .select("id, numero, nombre, foto_principal_url")
      .eq("tipo", validTipo)
      .eq("activo", true)
      .order("numero");
    if (error) {
      setAnimals([]);
      setLoadError(error.message);
      toast.error(`No se pudieron cargar los animales: ${error.message}`);
    } else {
      setAnimals(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTipo]);

  // Preload first 10 photos so they hit the cache before the user scrolls
  useEffect(() => {
    animals.slice(0, 10).forEach((a) => {
      if (a.foto_principal_url) {
        const img = new Image();
        img.src = a.foto_principal_url;
      }
    });
  }, [animals]);

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      {/* Header foto */}
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={headerImg} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <button
          onClick={() => navigate("/menu")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      {/* Banda dorada con título */}
      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-base">
        {title}
      </div>

      {/* Lista de animales */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive">No se pudieron cargar los animales</p>
            <p className="text-xs text-muted-foreground mt-2 px-6">{loadError}</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No hay {title.toLowerCase()} visibles</p>
            <p className="text-xs text-muted-foreground mt-2 px-6">
              Si no ves animales, verifica que tengas fincas asignadas. Pide a un admin que te asigne una finca o agrega un nuevo animal con el botón +.
            </p>
          </div>
        ) : (
          animals.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/animal/${a.id}`)}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform"
            >
              <AnimalAvatar src={a.foto_principal_url} alt={a.nombre ?? a.numero} />
              <div className="flex-1 text-left">
                <p className="font-bold text-base text-ink leading-tight">
                  {a.nombre ?? "Sin nombre"}
                </p>
                <p className="text-xs text-muted-foreground tracking-wide">{a.numero}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* FAB crear */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label="Agregar"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AnimalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tipo={validTipo}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default CategoriaAnimales;
