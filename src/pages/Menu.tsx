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

type CircleItem = {
  label: string;
  to: string;
  icon?: string;
  image?: string;
};

const items: CircleItem[] = [
  { label: "Fincas", to: "/fincas", image: iconFincas },
  { label: "Machos", to: "/categoria/macho", image: iconMachos },
  { label: "Hembras", to: "/categoria/hembra", image: iconHembras },
  { label: "Crías", to: "/categoria/cria", image: iconCrias },
  { label: "Embriones", to: "/categoria/embrion", image: iconEmbriones },
  { label: "Otros", to: "/generalidades", image: iconGeneralidades },
];

const CircleButton = ({ item }: { item: CircleItem }) => {
  const navigate = useNavigate();
  const id = `arc-${item.label.replace(/\s+/g, "-")}`;
  return (
    <button
      onClick={() => navigate(item.to)}
      className="flex flex-col items-center gap-0 active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 96 36" className="w-24 h-9 overflow-visible -mb-1">
        <defs>
          <path id={id} d="M 6 32 A 42 42 0 0 1 90 32" fill="transparent" />
        </defs>
        <text
          fill="hsl(var(--foreground))"
          style={{ fontSize: 14, letterSpacing: 1, fontWeight: 700 }}
        >
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {item.label.toUpperCase()}
          </textPath>
        </text>
      </svg>

      <div className="w-24 h-24 rounded-full border-[3px] border-gold shadow-soft overflow-hidden bg-card flex items-center justify-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.label}
            className="w-full h-full object-cover scale-110"
            loading="lazy"
          />
        ) : (
          <span className="text-3xl" aria-hidden>
            {item.icon}
          </span>
        )}
      </div>
    </button>
  );
};

const Menu = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <header className="relative h-44 overflow-hidden">
        <img
          src={menuHeader}
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
