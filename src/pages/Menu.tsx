import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import menuHeader from "@/assets/menu-header.webp";
import iconFincas from "@/assets/menu-icons/fincas.webp";
import iconMachos from "@/assets/menu-icons/machos.webp";
import iconHembras from "@/assets/menu-icons/hembras.webp";
import iconCrias from "@/assets/menu-icons/crias.webp";
import iconEmbriones from "@/assets/menu-icons/embriones.webp";
import iconGeneralidades from "@/assets/menu-icons/generalidades.webp";
import BottomTabBar from "@/components/BottomTabBar";
import VersionFooter from "@/components/VersionFooter";
import { LogOut } from "lucide-react";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS } from "@/lib/asset-keys";

type CircleItem = {
  label: string;
  to: string;
  assetKey: string;
  fallback: string;
};

const items: CircleItem[] = [
  { label: "Fincas", to: "/fincas", assetKey: ASSET_KEYS.iconFincas, fallback: iconFincas },
  { label: "Machos", to: "/categoria/macho", assetKey: ASSET_KEYS.iconMachos, fallback: iconMachos },
  { label: "Hembras", to: "/categoria/hembra", assetKey: ASSET_KEYS.iconHembras, fallback: iconHembras },
  { label: "Crías", to: "/categoria/cria", assetKey: ASSET_KEYS.iconCrias, fallback: iconCrias },
  { label: "Embriones", to: "/categoria/embrion", assetKey: ASSET_KEYS.iconEmbriones, fallback: iconEmbriones },
  { label: "Otros", to: "/generalidades", assetKey: ASSET_KEYS.iconOtros, fallback: iconGeneralidades },
];

const CircleButton = ({ item }: { item: CircleItem }) => {
  const navigate = useNavigate();
  const src = useAppAsset(item.assetKey, item.fallback);
  return (
    <button
      onClick={() => navigate(item.to)}
      className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <div className="w-24 h-24 rounded-full border-[3px] border-gold shadow-soft overflow-hidden bg-card flex items-center justify-center">
        <img
          src={src}
          alt={item.label}
          className="w-full h-full object-cover scale-110"
          loading="lazy"
        />
      </div>
      <span className="text-sm font-bold tracking-jps uppercase text-foreground">
        {item.label}
      </span>
    </button>
  );
};

const Menu = () => {
  const { signOut } = useAuth();
  const banner = useAppAsset(ASSET_KEYS.menuBanner, menuHeader);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="relative aspect-[865/503] overflow-hidden">
        <img
          src={banner}
          alt="Ganadería JPS"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <button
          onClick={signOut}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-sm">
        Control Genético JPS
      </div>

      <div className="px-6 py-8">
        <div className="grid grid-cols-2 gap-y-7 gap-x-4 justify-items-center">
          {items.map((item) => (
            <CircleButton key={item.to} item={item} />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <BottomTabBar fixed={false} />
        <div className="bg-black border-t border-gold/20 pb-[env(safe-area-inset-bottom)]">
          <VersionFooter />
        </div>
      </div>
    </div>
  );
};

export default Menu;
