import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Beef, Milk, Rabbit, Egg, MapPin, Shield, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AnimalHit = {
  id: string;
  codigo: string;
  nombre: string | null;
  tipo: string;
};

const SearchDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AnimalHit[]>([]);

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

  // Buscar animales (debounced)
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("animales")
        .select("id, codigo, nombre, tipo")
        .eq("activo", true)
        .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
        .limit(8);
      setHits(data ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[8%] translate-y-0 max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden shadow-lg data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
      >
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <CommandInput
            placeholder="Buscar animales, opciones de menú..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>

            <CommandGroup heading="Animales">
              {hits.length === 0 ? (
                <CommandItem disabled value="hint-animales">
                  <span className="text-muted-foreground">
                    Escribe código o nombre para buscar…
                  </span>
                </CommandItem>
              ) : (
                hits.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={`${a.codigo} ${a.nombre ?? ""}`}
                    onSelect={() => go(`/animal/${a.id}`)}
                  >
                    <span className="font-semibold mr-2">{a.codigo}</span>
                    <span className="text-muted-foreground truncate">
                      {a.nombre ?? "Sin nombre"} · {a.tipo}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>

            <CommandSeparator />

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
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
