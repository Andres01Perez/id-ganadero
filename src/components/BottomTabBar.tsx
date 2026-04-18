import { NavLink, useLocation } from "react-router-dom";
import { Beef, Milk, Rabbit, Egg, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { label: "Machos", to: "/categoria/macho", icon: Beef },
  { label: "Hembras", to: "/categoria/hembra", icon: Milk },
  { label: "Crías", to: "/categoria/cria", icon: Rabbit },
  { label: "Embriones", to: "/categoria/embrion", icon: Egg },
];

const BottomTabBar = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-gold/40 shadow-soft">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = pathname === t.to || pathname.startsWith(t.to + "/");
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2.5 transition-all active:scale-95",
                active ? "text-gold" : "text-gold-soft hover:text-gold"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 bg-gold rounded-b-full"
                />
              )}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.18em]",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {t.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
