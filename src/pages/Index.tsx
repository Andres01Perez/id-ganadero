import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroLogin from "@/assets/hero-login.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import VersionFooter from "@/components/VersionFooter";

type DisplayUser = { id: string; display_name: string };

const Index = () => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/menu", { replace: true });
  }, [user, navigate]);

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
    <div
      className="min-h-[100dvh] w-full flex flex-col relative bg-background overflow-hidden"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroLogin}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-10">
        {/* Branding */}
        <div className="w-full max-w-sm pt-4 text-center animate-fade-in">
          <div className="inline-block px-4 py-1 mb-3 border border-gold/40 rounded-full text-gold text-[10px] tracking-[0.3em] uppercase">
            JPS Ganadería
          </div>
          <h1 className="font-serif text-5xl text-gold leading-tight">
            ID Ganadero
          </h1>
          <p className="mt-3 text-sm text-gold-soft/80 italic">
            Tradición, control y precisión
          </p>
        </div>

        {/* Card de login */}
        <div className="w-full max-w-sm bg-card/95 backdrop-blur-md border border-gold/30 rounded-2xl p-6 shadow-leather animate-scale-in">
          <h2 className="font-serif text-xl text-gold mb-1">Bienvenido</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Selecciona tu nombre e ingresa tu contraseña
          </p>

          <div className="space-y-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingUsers}
              className="w-full h-12 rounded-lg bg-leather text-foreground text-base px-3 border border-border focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            >
              <option value="">
                {loadingUsers ? "Cargando..." : "— Selecciona tu nombre —"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
            </select>

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full h-12 rounded-lg bg-leather text-foreground text-base px-3 border border-border placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 rounded-lg bg-gold-gradient text-primary-foreground font-semibold tracking-wide uppercase text-sm shadow-gold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </div>
        </div>

        <VersionFooter />
      </div>
    </div>
  );
};

export default Index;
