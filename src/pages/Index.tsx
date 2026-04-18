import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBpp from "@/assets/hero-bpp.webp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type DisplayUser = { id: string; display_name: string };

const Index = () => {
  const [showInput, setShowInput] = useState(false);
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Si ya hay sesión, ir directo al menú
  useEffect(() => {
    if (user) navigate("/menu", { replace: true });
  }, [user, navigate]);

  // Cargar lista de nombres cuando se abre el input
  useEffect(() => {
    if (!showInput || users.length > 0) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke(
        "list-display-names"
      );
      if (error) {
        toast.error("No se pudo cargar la lista de usuarios");
        return;
      }
      setUsers((data?.users as DisplayUser[]) ?? []);
    })();
  }, [showInput, users.length]);

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
    // Reconstruir email sintético desde display_name
    const slug = selected.display_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
    const email = `${slug}@yopmail.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error("Contraseña incorrecta");
      return;
    }
    navigate("/menu", { replace: true });
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden select-none">
      <div
        className="w-full bg-background flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out"
        style={{ height: showInput ? "30dvh" : "80dvh" }}
      >
        <img
          src={heroBpp}
          alt="JPS Ganadería"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      <div
        className="w-full bg-primary flex flex-col items-center justify-center transition-all duration-500 ease-in-out px-6 gap-3"
        style={{ height: showInput ? "70dvh" : "20dvh" }}
      >
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full max-w-sm h-14 rounded-xl bg-white text-black text-lg font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            Iniciar Sesión
          </button>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-3 animate-fade-in">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-14 rounded-xl bg-white text-black text-center text-lg font-medium px-4 outline-none ring-2 ring-white/50 focus:ring-black/30 transition-all"
            >
              <option value="">— Selecciona tu nombre —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
            </select>
            <input
              type="password"
              inputMode="text"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full h-14 rounded-xl bg-white text-black text-center text-lg font-medium placeholder:text-gray-400 px-4 outline-none ring-2 ring-white/50 focus:ring-black/30 transition-all"
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-white text-black font-bold text-lg tracking-wide transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
