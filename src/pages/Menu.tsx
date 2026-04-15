import { useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Machos", path: "/machos", icon: "🐂" },
  { label: "Hembras", path: "/hembras", icon: "🐄" },
  { label: "Crías", path: "/crias", icon: "🐮" },
  { label: "Embriones", path: "/embriones", icon: "🧬" },
  { label: "Generalidades", path: "/generalidades", icon: "📋" },
];

const Menu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-8">
      <h1 className="text-2xl font-bold text-primary text-center mb-8">
        JPS Ganadería
      </h1>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all active:scale-95"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-foreground font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => { localStorage.removeItem("cedula"); navigate("/"); }}
        className="mt-8 mx-auto block text-muted-foreground text-sm underline"
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Menu;
