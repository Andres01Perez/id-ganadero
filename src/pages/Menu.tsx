import { useNavigate } from "react-router-dom";
import heroLogo from "@/assets/hero-logo.png";

const menuItems = [
  { label: "Machos", path: "/machos" },
  { label: "Hembras", path: "/hembras" },
  { label: "Crías", path: "/crias" },
  { label: "Embriones", path: "/embriones" },
  { label: "Generalidades", path: "/generalidades" },
];

const CircleButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  const id = `curve-${label.replace(/\s/g, "")}`;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:scale-95 transition-transform"
    >
      <svg
        width="120"
        height="40"
        viewBox="0 0 120 40"
        className="overflow-visible"
      >
        <defs>
          <path
            id={id}
            d="M10,35 Q60,-5 110,35"
            fill="none"
          />
        </defs>
        <text
          fill="hsl(43,50%,54%)"
          fontSize="13"
          fontWeight="700"
          letterSpacing="1.5"
          textAnchor="middle"
        >
          <textPath href={`#${id}`} startOffset="50%">
            {label.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <div className="w-[100px] h-[100px] rounded-full border-2 border-primary overflow-hidden bg-card flex items-center justify-center">
        <img
          src={`https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=200&h=200&fit=crop`}
          alt={label}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
    </button>
  );
};

const Menu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Hero */}
      <div className="w-full h-[30dvh] overflow-hidden flex items-center justify-center bg-background">
        <img
          src={heroLogo}
          alt="JPS Ganadería"
          className="w-full h-full object-contain p-4"
          draggable={false}
        />
      </div>

      {/* Circular menu */}
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto place-items-center">
          {menuItems.slice(0, 4).map((item) => (
            <CircleButton
              key={item.path}
              label={item.label}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
        {/* Last item centered */}
        <div className="flex justify-center mt-6">
          <CircleButton
            label={menuItems[4].label}
            onClick={() => navigate(menuItems[4].path)}
          />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.removeItem("cedula");
          navigate("/");
        }}
        className="mb-8 mx-auto block text-muted-foreground text-sm underline"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Menu;
