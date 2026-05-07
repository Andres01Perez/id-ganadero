import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Grid3x3, Beef, Package, ShoppingCart, DollarSign } from "lucide-react";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";

type ModuloItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: ModuloItem[] = [
  { label: "Empleados", to: "/finca/empleados", icon: Users },
  { label: "Potreros", to: "/finca/potreros", icon: Grid3x3 },
  { label: "Animales", to: "/finca/animales", icon: Beef },
  { label: "Inventario", to: "/finca/inventario", icon: Package },
  { label: "Compra", to: "/finca/compra", icon: ShoppingCart },
  { label: "Venta", to: "/finca/venta", icon: DollarSign },
];

const CircleButton = ({ item }: { item: ModuloItem }) => {
  const navigate = useNavigate();
  const Icon = item.icon;
  return (
    <button
      onClick={() => navigate(item.to)}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <div className="w-24 h-24 rounded-full border-[3px] border-gold shadow-soft bg-card flex items-center justify-center">
        <Icon className="h-10 w-10 text-gold-deep" />
      </div>
      <span className="text-sm font-bold tracking-jps uppercase text-foreground">
        {item.label}
      </span>
    </button>
  );
};

const MenuFinca = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const fallbackBanner = useAppAsset(ASSET_KEYS.bannerFincas, ASSET_FALLBACKS[ASSET_KEYS.bannerFincas]);
  const banner = fincaActiva?.foto_url || fallbackBanner;

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <FincaActivaChip />
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={banner} alt={fincaActiva?.nombre ?? ""} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <button
          onClick={() => navigate("/menu")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver al menú"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-sm">
        Gestión de Finca
      </div>

      <div className="px-6 py-8">
        <div className="grid grid-cols-2 gap-y-7 gap-x-4 justify-items-center">
          {items.map((item) => (
            <CircleButton key={item.to} item={item} />
          ))}
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default MenuFinca;
