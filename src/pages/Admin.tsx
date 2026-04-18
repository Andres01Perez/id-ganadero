import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const { displayName, roles, signOut } = useAuth();
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"operario" | "admin" | "super_admin">(
    "operario"
  );
  const [submitting, setSubmitting] = useState(false);

  const isSuper = roles.includes("super_admin");

  const handleCreate = async () => {
    if (!displayNameInput.trim() || !password) {
      toast.error("Nombre y contraseña son obligatorios");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke(
      "admin-create-user",
      {
        body: {
          display_name: displayNameInput.trim(),
          password,
          role,
        },
      }
    );
    setSubmitting(false);

    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success(`Usuario "${displayNameInput}" creado`);
    setDisplayNameInput("");
    setPassword("");
    setRole("operario");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-6">
      <div className="max-w-md mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Panel Admin</h1>
            <p className="text-sm text-foreground/60">
              {displayName} · {roles.join(", ")}
            </p>
          </div>
          <button
            onClick={() => navigate("/menu")}
            className="text-sm underline text-foreground/70"
          >
            ← Menú
          </button>
        </header>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Crear nuevo usuario</h2>

          <div className="space-y-2">
            <label className="text-sm text-foreground/70">
              Nombre visible
            </label>
            <input
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full h-12 rounded-lg bg-background border border-border px-3 outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-foreground/70">Contraseña</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 4 caracteres"
              className="w-full h-12 rounded-lg bg-background border border-border px-3 outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-foreground/70">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full h-12 rounded-lg bg-background border border-border px-3 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="operario">Operario</option>
              <option value="admin" disabled={!isSuper}>
                Admin {isSuper ? "" : "(solo super_admin)"}
              </option>
              <option value="super_admin" disabled={!isSuper}>
                Super Admin {isSuper ? "" : "(solo super_admin)"}
              </option>
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {submitting ? "Creando…" : "Crear usuario"}
          </button>
        </section>

        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="block mx-auto text-sm underline text-foreground/60"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Admin;
