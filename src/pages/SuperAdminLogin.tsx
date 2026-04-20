import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, roles } = useAuth();

  useEffect(() => {
    if (user && roles.includes("super_admin")) {
      navigate("/superadmin", { replace: true });
    }
  }, [user, roles, navigate]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Email y contraseña requeridos");
      return;
    }
    setLoading(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signErr) {
      setLoading(false);
      toast.error("Credenciales inválidas");
      return;
    }
    // Verificar rol super_admin
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) {
      setLoading(false);
      toast.error("Sesión inválida");
      return;
    }
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const isSuper =
      roleRows?.some((r) => r.role === "super_admin") ?? false;
    setLoading(false);
    if (!isSuper) {
      await supabase.auth.signOut();
      toast.error("No tienes permisos de super_admin");
      return;
    }
    navigate("/superadmin", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-neutral-900 border border-gold/40 rounded-2xl p-8 shadow-gold">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-gold-solid text-ink flex items-center justify-center mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-gold text-xl font-semibold">Super Admin</h1>
          <p className="text-xs text-gold-soft/70 mt-1">
            Acceso restringido · JPS Ganadería
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full h-12 rounded-lg bg-black text-gold-soft text-base px-3 border border-gold/40 placeholder:text-neutral-500 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoComplete="current-password"
            className="w-full h-12 rounded-lg bg-black text-gold-soft text-base px-3 border border-gold/40 placeholder:text-neutral-500 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 rounded-lg bg-gold-solid text-ink font-semibold tracking-wide uppercase text-sm shadow-gold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Validando…" : "Entrar"}
          </button>
        </div>

        <button
          onClick={() => navigate("/")}
          className="block mx-auto mt-6 text-xs text-gold-soft/60 hover:text-gold underline"
        >
          Volver al login normal
        </button>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
