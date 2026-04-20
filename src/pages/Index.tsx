import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/jps-login-hero.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS } from "@/lib/asset-keys";
import { toast } from "sonner";
import VersionFooter from "@/components/VersionFooter";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DisplayUser = { id: string; display_name: string };

const Index = () => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const heroSrc = useAppAsset(ASSET_KEYS.loginHero, heroImage);

  useEffect(() => {
    if (user) {
      if (roles.includes("super_admin")) {
        navigate("/superadmin", { replace: true });
      } else {
        navigate("/menu", { replace: true });
      }
    }
  }, [user, roles, navigate]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.functions.invoke("list-display-names");
      if (error) {
        toast.error("No se pudo cargar la lista de usuarios");
      } else {
        setUsers((data?.users as DisplayUser[]) ?? []);
      }
      setLoadingUsers(false);
    })();
  }, []);

  const handleLogin = async () => {
    const selected = users.find((u) => u.id === selectedId);
    if (!selected) {
      toast.error("Selecciona tu nombre");
      return;
    }
    if (!password) {
      toast.error("Digita tu contraseña");
      return;
    }
    setLoading(true);
    const slug = selected.display_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
    const email = `${slug}@yopmail.com`;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error("Contraseña incorrecta");
      return;
    }
    navigate("/menu", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-black overflow-hidden">
      {/* Hero compuesto: vaca + logo JPS embebido */}
      <div className="flex-1 relative">
        <img
          src={heroSrc}
          alt="JPS Ganadería"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Banda dorada inferior - botón de inicio */}
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gold-solid text-ink py-5 text-center tracking-jps font-semibold text-base uppercase active:brightness-95 transition-all"
      >
        Iniciar Sesión
      </button>

      {/* Modal de login: fondo negro, acentos dorados */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-black border-t-2 border-gold rounded-t-3xl p-6 pb-10 h-[70dvh] overflow-y-auto flex flex-col justify-center"
        >
          <div className="mx-auto w-full max-w-sm">
            <div className="text-center mb-5">
              <div className="inline-block px-4 py-1 mb-3 border border-gold/60 rounded-full text-gold text-[10px] tracking-[0.3em] uppercase">
                JPS Ganadería
              </div>
              <h2 className="text-gold text-2xl font-semibold">Bienvenido</h2>
              <p className="text-xs text-gold-soft/80 mt-1">
                Selecciona tu nombre e ingresa tu contraseña
              </p>
            </div>

            <div className="space-y-3">
              <Select value={selectedId} onValueChange={setSelectedId} disabled={loadingUsers}>
                <SelectTrigger className="w-full h-12 rounded-lg bg-neutral-900 text-gold-soft text-base px-3 border border-gold/40 focus:border-gold focus:ring-2 focus:ring-gold/30">
                  <SelectValue placeholder={loadingUsers ? "Cargando..." : "— Selecciona tu nombre —"} />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-gold/40 text-gold-soft z-[60]">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="focus:bg-gold/20 focus:text-gold">
                      {u.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full h-12 rounded-lg bg-neutral-900 text-gold-soft text-base px-3 border border-gold/40 placeholder:text-neutral-500 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
              />

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-12 rounded-lg bg-gold-solid text-ink font-semibold tracking-wide uppercase text-sm shadow-gold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Ingresando…" : "Entrar"}
              </button>
            </div>

            <div className="mt-6 opacity-70">
              <VersionFooter />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
