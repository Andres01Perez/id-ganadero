import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import jpsLogo from "@/assets/jps-logo.webp";
import SearchDialog from "@/components/SearchDialog";
import AgenteGanaderoDialog from "@/components/AgenteGanaderoDialog";
import { useAuth } from "@/hooks/useAuth";

const BottomTabBar = ({ fixed = true }: { fixed?: boolean }) => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const canUseAgente = roles.includes("admin") || roles.includes("super_admin");
  const [searchOpen, setSearchOpen] = useState(false);
  const [agenteOpen, setAgenteOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "bg-black border-t border-gold/40 shadow-soft",
          fixed && "fixed bottom-0 left-0 right-0 z-40 pb-safe"
        )}
      >
        <div className="flex items-end justify-between px-8 py-2">
          {/* Menú */}
          <button
            type="button"
            onClick={() => navigate("/menu")}
            className="flex flex-col items-center justify-center gap-1 py-1 text-gold-soft hover:text-gold transition-all active:scale-95"
            aria-label="Menú"
          >
            <Menu className="h-6 w-6" strokeWidth={1.75} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-medium">
              Menú
            </span>
          </button>

          {/* MarIA central — solo admins/super */}
          {canUseAgente ? (
            <button
              type="button"
              onClick={() => setAgenteOpen(true)}
              className="-mt-4 flex flex-col items-center gap-1 text-gold-soft transition-all active:scale-95"
              aria-label="Abrir Agente Ganadero"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-black shadow-soft">
                <img
                  src={jpsLogo}
                  alt="Agente Ganadero"
                  className="h-full w-full object-contain p-2"
                />
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] font-medium">
                Agente
              </span>
            </button>
          ) : (
            <span className="w-14" aria-hidden />
          )}

          {/* Buscar */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 text-gold-soft hover:text-gold transition-all active:scale-95"
            aria-label="Buscar"
          >
            <Search className="h-6 w-6" strokeWidth={1.75} />
            <span className="text-[10px] uppercase tracking-[0.18em] font-medium">
              Buscar
            </span>
          </button>
        </div>
      </nav>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      {canUseAgente && <AgenteGanaderoDialog open={agenteOpen} onOpenChange={setAgenteOpen} />}
    </>
  );
};

export default BottomTabBar;
