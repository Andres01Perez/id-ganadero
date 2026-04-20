import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, KeyRound, Building2, ToggleLeft, ToggleRight } from "lucide-react";

type AppRole = "super_admin" | "admin" | "operario";

type UserRow = {
  id: string;
  display_name: string;
  email: string;
  active: boolean;
  role: AppRole | null;
  finca_ids: string[];
};

type Finca = { id: string; nombre: string };

const roleLabel: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  operario: "Operario",
};

const Usuarios = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("operario");
  const [newFincas, setNewFincas] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [pwUser, setPwUser] = useState<UserRow | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [roleUser, setRoleUser] = useState<UserRow | null>(null);
  const [roleValue, setRoleValue] = useState<AppRole>("operario");
  const [savingRole, setSavingRole] = useState(false);

  const [fincasUser, setFincasUser] = useState<UserRow | null>(null);
  const [fincasSet, setFincasSet] = useState<Set<string>>(new Set());
  const [savingFincas, setSavingFincas] = useState(false);

  const load = async () => {
    setLoading(true);
    const [profsRes, rolesRes, accesosRes, fincasRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, email, active").order("display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_finca_acceso").select("user_id, finca_id"),
      supabase.from("fincas").select("id, nombre").eq("activo", true).order("nombre"),
    ]);
    const rolesMap: Record<string, AppRole> = {};
    (rolesRes.data ?? []).forEach((r) => {
      rolesMap[r.user_id] = r.role as AppRole;
    });
    const accesosMap: Record<string, string[]> = {};
    (accesosRes.data ?? []).forEach((r) => {
      if (!accesosMap[r.user_id]) accesosMap[r.user_id] = [];
      accesosMap[r.user_id].push(r.finca_id);
    });
    setUsers(
      (profsRes.data ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        active: p.active,
        role: rolesMap[p.id] ?? null,
        finca_ids: accesosMap[p.id] ?? [],
      }))
    );
    setFincas(fincasRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newPassword) {
      toast.error("Nombre y contraseña requeridos");
      return;
    }
    if (newRole === "operario" && newFincas.size === 0) {
      toast.error("Asigna al menos una finca al operario");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        display_name: newName.trim(),
        password: newPassword,
        role: newRole,
        finca_ids: Array.from(newFincas),
      },
    });
    setCreating(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success("Usuario creado");
    setCreateOpen(false);
    setNewName("");
    setNewPassword("");
    setNewRole("operario");
    setNewFincas(new Set());
    load();
  };

  const saveEditName = async () => {
    if (!editUser || !editName.trim()) return;
    setSavingEdit(true);
    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: { target_user_id: editUser.id, display_name: editName.trim() },
    });
    setSavingEdit(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success("Nombre actualizado");
    setEditUser(null);
    load();
  };

  const savePassword = async () => {
    if (!pwUser || pwValue.length < 4) {
      toast.error("Mínimo 4 caracteres");
      return;
    }
    setSavingPw(true);
    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: { target_user_id: pwUser.id, password: pwValue },
    });
    setSavingPw(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success("Contraseña actualizada");
    setPwUser(null);
    setPwValue("");
  };

  const saveRole = async () => {
    if (!roleUser) return;
    setSavingRole(true);
    const { data, error } = await supabase.functions.invoke("admin-update-user-role", {
      body: { target_user_id: roleUser.id, role: roleValue },
    });
    setSavingRole(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success("Rol actualizado");
    setRoleUser(null);
    load();
  };

  const toggleActive = async (u: UserRow) => {
    const { data, error } = await supabase.functions.invoke("admin-update-user", {
      body: { target_user_id: u.id, active: !u.active },
    });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Error");
      return;
    }
    toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
    load();
  };

  const saveFincas = async () => {
    if (!fincasUser) return;
    setSavingFincas(true);
    const initial = new Set(fincasUser.finca_ids);
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    fincasSet.forEach((id) => {
      if (!initial.has(id)) toAdd.push(id);
    });
    initial.forEach((id) => {
      if (!fincasSet.has(id)) toRemove.push(id);
    });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (toAdd.length > 0) {
        const { error } = await supabase.from("user_finca_acceso").insert(
          toAdd.map((fid) => ({
            user_id: fincasUser.id,
            finca_id: fid,
            created_by: user?.id ?? null,
          }))
        );
        if (error) throw error;
      }
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("user_finca_acceso")
          .delete()
          .eq("user_id", fincasUser.id)
          .in("finca_id", toRemove);
        if (error) throw error;
      }
      toast.success("Fincas actualizadas");
      setFincasUser(null);
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setSavingFincas(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona admins y operarios. Solo super_admin puede crear admins.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Fincas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const fincaNames = fincas
                  .filter((f) => u.finca_ids.includes(f.id))
                  .map((f) => f.nombre);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.display_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "super_admin" ? "default" : "secondary"}>
                        {u.role ? roleLabel[u.role] : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.role === "operario"
                        ? fincaNames.length > 0
                          ? fincaNames.join(", ")
                          : <span className="text-destructive">Sin fincas</span>
                        : <span className="text-muted-foreground">Todas</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "default" : "destructive"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditUser(u);
                            setEditName(u.display_name);
                          }}
                          title="Editar nombre"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPwUser(u);
                            setPwValue("");
                          }}
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleUser(u);
                            setRoleValue(u.role ?? "operario");
                          }}
                          title="Cambiar rol"
                        >
                          <Badge variant="outline" className="text-[10px] px-1.5">Rol</Badge>
                        </Button>
                        {u.role === "operario" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFincasUser(u);
                              setFincasSet(new Set(u.finca_ids));
                            }}
                            title="Editar fincas"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(u)}
                          title={u.active ? "Desactivar" : "Activar"}
                        >
                          {u.active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre visible</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Contraseña</label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Rol</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operario">Operario</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole === "operario" && (
              <div>
                <label className="text-xs text-muted-foreground">Fincas</label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
                  {fincas.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2 px-2 py-1 cursor-pointer rounded hover:bg-secondary/40"
                    >
                      <Checkbox
                        checked={newFincas.has(f.id)}
                        onCheckedChange={() => {
                          setNewFincas((prev) => {
                            const n = new Set(prev);
                            if (n.has(f.id)) n.delete(f.id);
                            else n.add(f.id);
                            return n;
                          });
                        }}
                      />
                      <span className="text-sm">{f.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar nombre */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nombre</DialogTitle>
          </DialogHeader>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            El email se recalcula automáticamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={saveEditName} disabled={savingEdit}>
              {savingEdit ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cambiar contraseña */}
      <Dialog open={!!pwUser} onOpenChange={(o) => !o && setPwUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contraseña · {pwUser?.display_name}</DialogTitle>
          </DialogHeader>
          <Input
            type="text"
            value={pwValue}
            onChange={(e) => setPwValue(e.target.value)}
            placeholder="Nueva contraseña"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwUser(null)}>Cancelar</Button>
            <Button onClick={savePassword} disabled={savingPw}>
              {savingPw ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cambiar rol */}
      <Dialog open={!!roleUser} onOpenChange={(o) => !o && setRoleUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar rol · {roleUser?.display_name}</DialogTitle>
          </DialogHeader>
          <Select value={roleValue} onValueChange={(v) => setRoleValue(v as AppRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operario">Operario</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleUser(null)}>Cancelar</Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar fincas */}
      <Dialog open={!!fincasUser} onOpenChange={(o) => !o && setFincasUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fincas · {fincasUser?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
            {fincas.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded hover:bg-secondary/40"
              >
                <Checkbox
                  checked={fincasSet.has(f.id)}
                  onCheckedChange={() => {
                    setFincasSet((prev) => {
                      const n = new Set(prev);
                      if (n.has(f.id)) n.delete(f.id);
                      else n.add(f.id);
                      return n;
                    });
                  }}
                />
                <span className="text-sm">{f.nombre}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFincasUser(null)}>Cancelar</Button>
            <Button onClick={saveFincas} disabled={savingFincas}>
              {savingFincas ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
