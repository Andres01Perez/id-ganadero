import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fincaId?: string | null;
  onSaved?: () => void;
};

const schema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(80),
  ubicacion: z.string().trim().max(120).optional().or(z.literal("")),
  hectareas: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), "Hectáreas debe ser numérico"),
});

type Operario = { id: string; display_name: string };

const FincaForm = ({ open, onOpenChange, fincaId, onSaved }: Props) => {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isEdit = !!fincaId;

  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [hectareas, setHectareas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [selectedOps, setSelectedOps] = useState<Set<string>>(new Set());
  const [initialOps, setInitialOps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;

    if (fincaId) {
      (async () => {
        const { data, error } = await supabase
          .from("fincas")
          .select("*")
          .eq("id", fincaId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar la finca");
          onOpenChange(false);
          return;
        }
        setNombre(data.nombre);
        setUbicacion(data.ubicacion ?? "");
        setHectareas(data.hectareas != null ? String(data.hectareas) : "");
      })();
    } else {
      setNombre("");
      setUbicacion("");
      setHectareas("");
    }

    // Cargar operarios disponibles + asignaciones (solo admin)
    if (isAdmin) {
      (async () => {
        // Obtener IDs de usuarios con rol operario
        const { data: rolesRows } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "operario");
        const operarioIds = (rolesRows ?? []).map((r) => r.user_id);

        if (operarioIds.length === 0) {
          setOperarios([]);
        } else {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", operarioIds)
            .eq("active", true)
            .order("display_name");
          setOperarios(profs ?? []);
        }

        if (fincaId) {
          const { data: accesos } = await supabase
            .from("user_finca_acceso")
            .select("user_id")
            .eq("finca_id", fincaId);
          const ids = new Set((accesos ?? []).map((a) => a.user_id));
          setSelectedOps(ids);
          setInitialOps(ids);
        } else {
          setSelectedOps(new Set());
          setInitialOps(new Set());
        }
      })();
    }
  }, [open, fincaId, onOpenChange, isAdmin]);

  const toggleOp = (id: string) => {
    setSelectedOps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const syncAccesos = async (theFincaId: string, callerId: string) => {
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    selectedOps.forEach((id) => {
      if (!initialOps.has(id)) toAdd.push(id);
    });
    initialOps.forEach((id) => {
      if (!selectedOps.has(id)) toRemove.push(id);
    });

    if (toAdd.length > 0) {
      const rows = toAdd.map((uid) => ({
        user_id: uid,
        finca_id: theFincaId,
        created_by: callerId,
      }));
      const { error } = await supabase.from("user_finca_acceso").insert(rows);
      if (error) throw error;
    }
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("user_finca_acceso")
        .delete()
        .eq("finca_id", theFincaId)
        .in("user_id", toRemove);
      if (error) throw error;
    }
  };

  const handleSubmit = async () => {
    const parsed = schema.safeParse({ nombre, ubicacion, hectareas });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: parsed.data.nombre,
        ubicacion: parsed.data.ubicacion || null,
        hectareas: parsed.data.hectareas ? Number(parsed.data.hectareas) : null,
      };

      const { data: { user } } = await supabase.auth.getUser();

      let savedId = fincaId ?? null;
      if (isEdit && fincaId) {
        const { error } = await supabase.from("fincas").update(payload).eq("id", fincaId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("fincas")
          .insert({ ...payload, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        savedId = data.id;
      }

      if (isAdmin && savedId && user) {
        await syncAccesos(savedId, user.id);
      }

      toast.success(isEdit ? "Finca actualizada" : "Finca creada");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!fincaId) return;
    if (!confirm("¿Desactivar esta finca?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("fincas")
      .update({ activo: false })
      .eq("id", fincaId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo desactivar");
      return;
    }
    toast.success("Finca desactivada");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar finca" : "Nueva finca"}</SheetTitle>
          <SheetDescription>Datos generales de la finca.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="f-nombre">Nombre *</Label>
            <Input
              id="f-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. La Esperanza"
            />
          </div>
          <div>
            <Label htmlFor="f-ubic">Ubicación</Label>
            <Input
              id="f-ubic"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Vereda, municipio…"
            />
          </div>
          <div>
            <Label htmlFor="f-hect">Hectáreas</Label>
            <Input
              id="f-hect"
              type="number"
              step="0.01"
              min="0"
              value={hectareas}
              onChange={(e) => setHectareas(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="border-t border-border pt-4">
              <Label>Operarios asignados</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Los operarios marcados podrán ver y gestionar los animales de esta finca.
              </p>
              {operarios.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No hay operarios disponibles.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {operarios.map((op) => (
                    <label
                      key={op.id}
                      className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedOps.has(op.id)}
                        onCheckedChange={() => toggleOp(op.id)}
                      />
                      <span className="text-sm">{op.display_name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gold-solid text-ink hover:bg-gold-solid/90 h-12 text-base font-semibold"
            >
              {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
            {isEdit && isAdmin && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? "…" : "Desactivar"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FincaForm;
