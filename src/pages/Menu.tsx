import { useNavigate } from "react-router-dom";
import heroLogo from "@/assets/hero-menu.webp";
import { useAuth } from "@/hooks/useAuth";
import fincasImg from "@/assets/menu/fincas.webp";
import machosImg from "@/assets/menu/machos.webp";
import hembrasImg from "@/assets/menu/hembras.webp";
import criasImg from "@/assets/menu/crias.webp";
import embrionesImg from "@/assets/menu/embriones.webp";
import generalidadesImg from "@/assets/menu/generalidades.webp";
import VersionFooter from "@/components/VersionFooter";

const menuItems = [
  { label: "Fincas", path: "/fincas", img: fincasImg },
  { label: "Machos", path: "/machos", img: machosImg },
  { label: "Hembras", path: "/hembras", img: hembrasImg },
  { label: "Crías", path: "/crias", img: criasImg },
  { label: "Embriones", path: "/embriones", img: embrionesImg },
  { label: "Generalidades", path: "/generalidades", img: generalidadesImg },
];

const Menu = () => {
  const navigate = useNavigate();
  const { displayName, roles, signOut } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Hero */}
      <div className="w-full h-[30dvh] overflow-hidden flex items-center justify-center bg-background">
        <img
          src={heroLogo}
          alt="JPS Ganadería"
          className="w-full h-full object-contain p-4"
          draggable={false}
        />
      </div>

      {/* Divider */}
      <div className="w-full h-[15px] bg-[#b79f60]" />

      {/* Menu section */}
      <div className="flex-1 bg-white px-4 py-6">
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto place-items-center">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-[140px] h-auto"
                draggable={false}
              />
              <span className="text-[#b79f60] font-bold text-sm uppercase tracking-wide">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white pb-8 pt-2 flex flex-col items-center gap-2">
        {displayName && (
          <span className="text-gray-500 text-xs">Hola, {displayName}</span>
        )}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="text-[#b79f60] text-sm font-semibold underline"
          >
            Panel admin
          </button>
        )}
        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="text-gray-600 text-sm underline"
        >
          Cerrar sesión
        </button>
        <VersionFooter />
      </div>
    </div>
  );
};

export default Menu;
