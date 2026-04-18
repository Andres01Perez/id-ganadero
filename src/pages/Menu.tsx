import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import menuHeader from "@/assets/menu-header.jpg";
import jpsLogo from "@/assets/jps-logo.webp";
import BottomTabBar from "@/components/BottomTabBar";
import { LogOut, Shield } from "lucide-react";

type CircleItem = {
  label: string;
  to: string;
  icon?: string;
  solid?: boolean;
};

const items: CircleItem[] = [
  { label: "Fincas", to: "/fincas", icon: "🏡" },
  { label: "Machos", to: "/categoria/macho", icon: "🐂" },
  { label: "Hembras", to: "/categoria/hembra", icon: "🐄" },
  { label: "Crías", to: "/categoria/cria", icon: "🐃" },
  { label: "Embriones", to: "/categoria/embrion", icon: "🥚" },
  { label: "Generalidades", to: "/generalidades", solid: true },
];

const CircleButton = ({ item }: { item: CircleItem }) => {
  const navigate = useNavigate();
  const id = `arc-${item.label.replace(/\s+/g, "-")}`;
  return (
    <button
      onClick={() => navigate(item.to)}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 120 40" className="w-28 h-8">
        <defs>
          <path id={id} d="M 10 35 A 50 50 0 0 1 110 35" fill="transparent" />
        </defs>
        <text className="fill-foreground" style={{ fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {item.label.toUpperCase()}
          </textPath>
        </text>
      </svg>

      <div
        className={`w-24 h-24 rounded-full border-[3px] border-gold flex items-center justify-center shadow-soft overflow-hidden ${
          item.solid ? "bg-gold-solid" : "bg-card"
        }`}
      >
        {item.solid ? (
          <img src={jpsLogo} alt="" className="w-14 h-14 object-contain" />
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
  const { signOut, roles } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  return (
    <div className="min-h-[100dvh] bg-background pb-16">
      <header className="relative h-44 overflow-hidden">
        <img
          src={menuHeader}
          alt="Ganadería JPS"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
              aria-label="Admin"
            >
              <Shield className="h-4 w-4" />
            </button>
          )}
          <img src={jpsLogo} alt="JPS" className="h-14 w-14 object-contain drop-shadow-lg" />
        </div>
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

      <BottomTabBar />
    </div>
  );
};

export default Menu;
