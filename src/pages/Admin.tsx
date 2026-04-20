import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import VersionFooter from "@/components/VersionFooter";
import jpsLogo from "@/assets/jps-logo.webp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, ArrowLeft, AlertTriangle, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Animal = {
  id: string;
  codigo: string;
  nombre: string | null;
  tipo: string;
  foto_principal_url: string | null;
};

type Finca = { id: string; nombre: string };
type Operario = { id: string; display_name: string };

const resizeImage = (file: File, maxSize = 800): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.85);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const AnimalPhotoRow = ({ animal, onUpdated }: { animal: Animal; onUpdated: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeImage(file, 800);
      const path = `${animal.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("animal-fotos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("animal-fotos").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("animales")
        .update({ foto_principal_url: pub.publicUrl })
        .eq("id", animal.id);
      if (dbErr) throw dbErr;
      toast.success("Foto actualizada");
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo subir la foto");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft">
      <div className="w-14 h-14 rounded-full border-2 border-gold bg-white overflow-hidden flex items-center justify-center shrink-0">
        {animal.foto_principal_url ? (
          <img src={animal.foto_principal_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <img src={jpsLogo} alt="" className="w-7 h-7 object-contain opacity-60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{animal.nombre ?? "Sin nombre"}</p>
        <p className="text-xs text-muted-foreground truncate">
          {animal.codigo} · {animal.tipo}
        </p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="h-9 px-3 rounded-lg bg-gold-solid text-ink text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "..." : "Foto"}
      </button>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const { displayName, roles, signOut } = useAuth();
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"operario" | "admin" | "super_admin">("operario");
  const [submitting, setSubmitting] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [orphanCount, setOrphanCount] = useState(0);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const [fincas, setFincas] = useState<Finca[]>([]);
  const [newUserFincas, setNewUserFincas] = useState<Set<string>>(new Set());

  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [opAccesos, setOpAccesos] = useState<Record<string, Set<string>>>({});
  const [editingOp, setEditingOp] = useState<Operario | null>(null);
  const [editingOpFincas, setEditingOpFincas] = useState<Set<string>>(new Set());
  const [savingOp, setSavingOp] = useState(false);

  const isSuper = roles.includes("super_admin");

  const loadAnimals = async () => {
    setLoadingAnimals(true);
    const { data, error } = await supabase
      .from("animales")
      .select("id, codigo, nombre, tipo, foto_principal_url, finca_id")
      .eq("activo", true)
      .order("codigo");
    if (error) toast.error("No se pudieron cargar animales");
    else {
      setAnimals(data ?? []);
      setOrphanCount((data ?? []).filter((a) => !a.finca_id).length);
    }
    setLoadingAnimals(false);
  };

  const loadFincas = async () => {
    const { data } = await supabase
      .from("fincas")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre");
    setFincas(data ?? []);
  };

  const loadOperarios = async () => {
    const { data: rolesRows } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "operario");
    const ids = (rolesRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setOperarios([]);
      setOpAccesos({});
      return;
    }
    const [profsRes, accesosRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name").in("id", ids).eq("active", true).order("display_name"),
      supabase.from("user_finca_acceso").select("user_id, finca_id").in("user_id", ids),
    ]);
    setOperarios(profsRes.data ?? []);
    const acc: Record<string, Set<string>> = {};
    (accesosRes.data ?? []).forEach((r) => {
      if (!acc[r.user_id]) acc[r.user_id] = new Set();
      acc[r.user_id].add(r.finca_id);
    });
    setOpAccesos(acc);
  };

  useEffect(() => {
    loadAnimals();
    loadFincas();
    loadOperarios();
  }, []);

  const toggleNewFinca = (id: string) => {
    setNewUserFincas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!displayNameInput.trim() || !password) {
      toast.error("Nombre y contraseña son obligatorios");
      return;
    }
    if (role === "operario" && newUserFincas.size === 0) {
      toast.error("Asigna al menos una finca al operario");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        display_name: displayNameInput.trim(),
        password,
        role,
        finca_ids: Array.from(newUserFincas),
      },
    });
    setSubmitting(false);

    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success(`Usuario "${displayNameInput}" creado`);
    setDisplayNameInput("");
    setPassword("");
    setRole("operario");
    setNewUserFincas(new Set());
    loadOperarios();
  };

  const openEditOp = (op: Operario) => {
    setEditingOp(op);
    setEditingOpFincas(new Set(opAccesos[op.id] ?? []));
  };

  const toggleEditingFinca = (id: string) => {
    setEditingOpFincas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveEditOp = async () => {
    if (!editingOp) return;
    setSavingOp(true);
    try {
      const initial = opAccesos[editingOp.id] ?? new Set();
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      editingOpFincas.forEach((id) => {
        if (!initial.has(id)) toAdd.push(id);
      });
      initial.forEach((id) => {
        if (!editingOpFincas.has(id)) toRemove.push(id);
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (toAdd.length > 0) {
        const rows = toAdd.map((fid) => ({
          user_id: editingOp.id,
          finca_id: fid,
          created_by: user?.id ?? null,
        }));
        const { error } = await supabase.from("user_finca_acceso").insert(rows);
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("user_finca_acceso")
          .delete()
          .eq("user_id", editingOp.id)
          .in("finca_id", toRemove);
        if (error) throw error;
      }
      toast.success("Asignaciones actualizadas");
      setEditingOp(null);
      loadOperarios();
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSavingOp(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="bg-black text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/menu")} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gold">Panel Admin</h1>
          <p className="text-xs opacity-70">{displayName} · {roles.join(", ")}</p>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <Tabs defaultValue="animales" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-secondary">
            <TabsTrigger value="animales">Animales</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="animales" className="space-y-3 mt-4">
            {orphanCount > 0 && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>
                  Hay <strong>{orphanCount}</strong> animal(es) sin finca asignada. Los operarios no pueden verlos.
                  Edítalos desde su hoja de vida y asígnales una finca.
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Sube una foto por animal. Se redimensiona automáticamente a 800×800px.
            </p>
            {loadingAnimals ? (
              <p className="text-center text-sm text-muted-foreground py-6">Cargando…</p>
            ) : animals.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                No hay animales registrados todavía.
              </p>
            ) : (
              animals.map((a) => (
                <AnimalPhotoRow key={a.id} animal={a} onUpdated={loadAnimals} />
              ))
            )}
          </TabsContent>

          <TabsContent value="usuarios" className="mt-4 space-y-6">
            <section className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-semibold">Crear nuevo usuario</h2>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nombre visible</label>
                <input
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full h-12 rounded-lg bg-background border border-border px-3 outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Contraseña</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full h-12 rounded-lg bg-background border border-border px-3 outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Rol</label>
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

              {role === "operario" && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Fincas asignadas *</label>
                  {fincas.length === 0 ? (
                    <p className="text-xs text-destructive">
                      No hay fincas. Crea una finca primero desde el menú "Fincas".
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                      {fincas.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded hover:bg-secondary/40"
                        >
                          <Checkbox
                            checked={newUserFincas.has(f.id)}
                            onCheckedChange={() => toggleNewFinca(f.id)}
                          />
                          <span className="text-sm">{f.nombre}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-gold-solid text-ink font-bold disabled:opacity-60"
              >
                {submitting ? "Creando…" : "Crear usuario"}
              </button>
            </section>

            <section className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h2 className="text-lg font-semibold">Operarios existentes</h2>
              {operarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay operarios registrados.</p>
              ) : (
                operarios.map((op) => {
                  const fincaIds = opAccesos[op.id] ?? new Set();
                  const fincaNames = fincas
                    .filter((f) => fincaIds.has(f.id))
                    .map((f) => f.nombre);
                  return (
                    <div
                      key={op.id}
                      className="flex items-center gap-3 bg-secondary/40 rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{op.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {fincaNames.length > 0
                            ? fincaNames.join(" · ")
                            : "Sin fincas asignadas"}
                        </p>
                      </div>
                      <button
                        onClick={() => openEditOp(op)}
                        className="h-9 px-3 rounded-lg bg-gold-solid text-ink text-xs font-semibold flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Fincas
                      </button>
                    </div>
                  );
                })
              )}
            </section>
          </TabsContent>
        </Tabs>

        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="block mx-auto text-sm underline text-muted-foreground mt-6"
        >
          Cerrar sesión
        </button>
        <VersionFooter />
      </div>

      <Dialog open={!!editingOp} onOpenChange={(o) => !o && setEditingOp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar fincas a {editingOp?.display_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {fincas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay fincas disponibles.</p>
            ) : (
              fincas.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 bg-secondary/40 rounded-lg px-3 py-2 cursor-pointer"
                >
                  <Checkbox
                    checked={editingOpFincas.has(f.id)}
                    onCheckedChange={() => toggleEditingFinca(f.id)}
                  />
                  <span className="text-sm">{f.nombre}</span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOp(null)} disabled={savingOp}>
              Cancelar
            </Button>
            <Button
              onClick={saveEditOp}
              disabled={savingOp}
              className="bg-gold-solid text-ink hover:bg-gold-solid/90"
            >
              {savingOp ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
