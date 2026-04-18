import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Machos", to: "/categoria/macho" },
  { label: "Hembras", to: "/categoria/hembra" },
  { label: "Crías", to: "/categoria/cria" },
  { label: "Embriones", to: "/categoria/embrion" },
];

const BottomTabBar = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-gold/40 shadow-soft">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "py-3 text-center text-[11px] tracking-[0.18em] uppercase font-semibold transition-colors",
                active
                  ? "bg-white text-gold-deep"
                  : "text-gold-soft hover:text-gold"
              )}
            >
              {t.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
