import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFinca } from "@/contexts/FincaContext";
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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empleadoId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const schema = z.object({
  nombre_completo: z.string().trim().min(2, "Nombre obligatorio").max(120),
  cedula: z.string().trim().max(40).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  fecha_ingreso: z.string().optional().or(z.literal("")),
  notas: z.string().max(500).optional().or(z.literal("")),
});

const EmpleadoForm = ({ open, onOpenChange, empleadoId, onSaved }: Props) => {
  const { user, roles } = useAuth();
  const { fincaActiva } = useFinca();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isEdit = !!empleadoId;

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [fnac, setFnac] = useState("");
  const [fingreso, setFingreso] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (empleadoId) {
      (async () => {
        const { data, error } = await supabase
          .from("empleados")
          .select("*")
          .eq("id", empleadoId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar el empleado");
          onOpenChange(false);
          return;
        }
        setNombre(data.nombre_completo ?? "");
        setCedula(data.cedula ?? "");
        setFnac(data.fecha_nacimiento ?? "");
        setFingreso(data.fecha_ingreso ?? "");
        setNotas(data.notas ?? "");
      })();
    } else {
      setNombre("");
      setCedula("");
      setFnac("");
      setFingreso("");
      setNotas("");
    }
  }, [open, empleadoId, onOpenChange]);

  const handleSubmit = async () => {
    if (!user || !fincaActiva) return;
    if (!isAdmin) {
      toast.error("Solo administradores pueden gestionar empleados");
      return;
    }
    const parsed = schema.safeParse({
      nombre_completo: nombre,
      cedula,
      fecha_nacimiento: fnac,
      fecha_ingreso: fingreso,
      notas,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre_completo: parsed.data.nombre_completo,
        cedula: parsed.data.cedula || null,
        fecha_nacimiento: parsed.data.fecha_nacimiento || null,
        fecha_ingreso: parsed.data.fecha_ingreso || null,
        notas: parsed.data.notas || null,
      };

      if (isEdit && empleadoId) {
        const { error } = await supabase
          .from("empleados")
          .update(payload)
          .eq("id", empleadoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("empleados")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        const { error: linkErr } = await supabase
          .from("empleado_fincas")
          .insert({
            empleado_id: data.id,
            finca_id: fincaActiva.id,
            created_by: user.id,
          });
        if (linkErr) throw linkErr;
      }

      toast.success(isEdit ? "Empleado actualizado" : "Empleado creado");
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string };
      console.error(err);
      toast.error(e.message ?? "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!empleadoId) return;
    if (!confirm("¿Desactivar este empleado?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("empleados")
      .update({ activo: false })
      .eq("id", empleadoId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo desactivar");
      return;
    }
    toast.success("Empleado desactivado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar empleado" : "Nuevo empleado"}</SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : "Datos del empleado"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cedula">Cédula</Label>
            <Input id="cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fnac">F. nacimiento</Label>
              <Input id="fnac" type="date" value={fnac} onChange={(e) => setFnac(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fing">F. ingreso</Label>
              <Input id="fing" type="date" value={fingreso} onChange={(e) => setFingreso(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
            {isEdit && isAdmin && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "…" : "Desactivar"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EmpleadoForm;
