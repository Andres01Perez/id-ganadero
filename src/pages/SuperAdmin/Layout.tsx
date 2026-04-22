import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Building2,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import jpsLogo from "@/assets/jps-logo.webp";

const navItems = [
  { to: "/superadmin", end: true, label: "Resumen", icon: LayoutDashboard },
  { to: "/superadmin/gestion", label: "Gestión", icon: ClipboardList },
  { to: "/superadmin/usuarios", label: "Usuarios", icon: Users },
  { to: "/superadmin/imagenes", label: "Imágenes", icon: ImageIcon },
  { to: "/superadmin/finca", label: "Información finca", icon: Building2 },
];

const SuperAdminLayout = () => {
  const { displayName, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/sa", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      <aside className="w-60 shrink-0 bg-black text-gold-soft flex flex-col border-r border-gold/30">
        <div className="px-4 py-5 border-b border-gold/20 flex items-center gap-3">
          <img src={jpsLogo} alt="JPS" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-gold text-sm font-bold leading-tight">
              JPS Superadmin
            </p>
            <p className="text-[10px] opacity-60">{displayName ?? "—"}</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-gold-solid text-ink font-semibold"
                    : "hover:bg-gold/10 text-gold-soft"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gold/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gold-soft hover:bg-gold/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
