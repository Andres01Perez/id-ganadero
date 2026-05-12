import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";

const opciones: { label: string; to: string }[] = [
  { label: "Ganado Inactivo", to: "/gestion/ganado-inactivo" },
  { label: "Movimientos", to: "/gestion/movimientos" },
];

const MenuGestion = () => {
  const navigate = useNavigate();
  const banner = useAppAsset(ASSET_KEYS.bannerFincas, ASSET_FALLBACKS[ASSET_KEYS.bannerFincas]);

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={banner} alt="" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <button
          onClick={() => navigate("/menu")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-sm">
        Gestión
      </div>

      <div className="px-6 py-8 flex flex-col items-center gap-4">
        {opciones.map((o) => (
          <button
            key={o.to}
            onClick={() => navigate(o.to)}
            className="w-64 text-center bg-gold-solid text-ink rounded-full py-3 px-6 text-sm font-semibold uppercase tracking-wider shadow-gold active:scale-95 transition-transform"
          >
            {o.label}
          </button>
        ))}
      </div>

      <BottomTabBar />
    </div>
  );
};

export default MenuGestion;
