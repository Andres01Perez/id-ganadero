import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import fincasImg from "@/assets/menu/fincas.jpg";
import machosImg from "@/assets/menu/machos.jpg";
import hembrasImg from "@/assets/menu/hembras.jpg";
import criasImg from "@/assets/menu/crias.jpg";
import embrionesImg from "@/assets/menu/embriones.jpg";
import otrosImg from "@/assets/menu/otros.jpg";
import VersionFooter from "@/components/VersionFooter";
import { LogOut, Shield } from "lucide-react";

const menuItems = [
  { label: "Fincas", path: "/fincas", img: fincasImg, desc: "Predios y ubicaciones" },
  { label: "Machos", path: "/categoria/macho", img: machosImg, desc: "Toros reproductores" },
  { label: "Hembras", path: "/categoria/hembra", img: hembrasImg, desc: "Vientres" },
  { label: "Crías", path: "/categoria/cria", img: criasImg, desc: "Terneros" },
  { label: "Embriones", path: "/categoria/embrion", img: embrionesImg, desc: "Reproducción asistida" },
  { label: "Otros", path: "/categoria/otro", img: otrosImg, desc: "Generalidades" },
];

const Menu = () => {
  const navigate = useNavigate();
  const { displayName, roles, signOut } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const firstName = displayName?.split(" ")[0] ?? "";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="px-5 pt-8 pb-5 bg-leather border-b border-gold/20">
        <div className="max-w-md mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gold-soft/70">
            JPS Ganadería
          </p>
          <h1 className="font-serif text-3xl text-gold mt-1">
            Hola, <span className="italic">{firstName || "Operario"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ¿Qué vas a registrar hoy?
          </p>
        </div>
      </header>

      {/* Grid de categorías */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          {menuItems.map((item, i) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-gold/20 shadow-leather active:scale-[0.97] transition-all animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={item.img}
                alt={item.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                <h3 className="font-serif text-lg text-gold leading-tight">
                  {item.label}
                </h3>
                <p className="text-[10px] text-gold-soft/70 mt-0.5 uppercase tracking-wider">
                  {item.desc}
                </p>
              </div>
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold/70 shadow-gold" />
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-5 py-5 border-t border-gold/15 bg-leather/50">
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-gold text-sm font-medium hover:text-gold-soft transition-colors"
            >
              <Shield className="w-4 h-4" />
              Panel administrativo
            </button>
          )}
          <button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
          <VersionFooter />
        </div>
      </footer>
    </div>
  );
};

export default Menu;
