import { useNavigate } from "react-router-dom";
import heroLogo from "@/assets/hero-logo.png";
import fincasImg from "@/assets/menu/fincas.png";
import machosImg from "@/assets/menu/machos.png";
import hembrasImg from "@/assets/menu/hembras.png";
import criasImg from "@/assets/menu/crias.png";
import embrionesImg from "@/assets/menu/embriones.png";
import generalidadesImg from "@/assets/menu/generalidades.png";

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
      <div className="w-full h-[3px] bg-[#b79f60]" />

      {/* Menu section */}
      <div className="flex-1 bg-white px-4 py-6">
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto place-items-center">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="active:scale-95 transition-transform"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-[140px] h-auto"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white pb-8">
        <button
          onClick={() => {
            localStorage.removeItem("cedula");
            navigate("/");
          }}
          className="mx-auto block text-gray-600 text-sm underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Menu;
