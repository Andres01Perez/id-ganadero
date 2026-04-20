import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Beef, Milk, Rabbit, Egg, MapPin, Shield, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SearchDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const menuItems = [
    { label: "Menú principal", to: "/menu", icon: LayoutGrid },
    { label: "Fincas", to: "/fincas", icon: MapPin },
    { label: "Machos", to: "/categoria/macho", icon: Beef },
    { label: "Hembras", to: "/categoria/hembra", icon: Milk },
    { label: "Crías", to: "/categoria/cria", icon: Rabbit },
    { label: "Embriones", to: "/categoria/embrion", icon: Egg },
    { label: "Otros", to: "/categoria/otro", icon: LayoutGrid },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar animales, opciones de menú..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Menú">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                value={item.label}
                onSelect={() => go(item.to)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
          {isAdmin && (
            <CommandItem value="Admin" onSelect={() => go("/admin")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Animales">
          <CommandItem disabled value="proximamente-animales">
            <span className="text-muted-foreground">
              Próximamente buscarás animales aquí
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default SearchDialog;
