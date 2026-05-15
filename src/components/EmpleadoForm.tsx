import { useEffect, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Camera, User, Trash2 } from "lucide-react";
import ImageCropDialog from "@/components/ImageCropDialog";
import { hoyISO } from "@/lib/empleado-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empleadoId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const schema = z
  .object({
    nombre_completo: z.string().trim().min(2, "Nombre obligatorio").max(120),
    cedula: z.string().trim().max(40).optional().or(z.literal("")),
    fecha_nacimiento: z.string().optional().or(z.literal("")),
    fecha_ingreso: z.string().optional().or(z.literal("")),
    fecha_salida: z.string().optional().or(z.literal("")),
    notas: z.string().max(500).optional().or(z.literal("")),
    activo: z.boolean(),
  })
  .refine(
    (d) =>
      !d.fecha_ingreso ||
      !d.fecha_salida ||
      d.fecha_salida >= d.fecha_ingreso,
    { message: "La fecha de salida no puede ser anterior al ingreso", path: ["fecha_salida"] },
  );

const EmpleadoForm = ({ open, onOpenChange, empleadoId, onSaved }: Props) => {
  const { user, roles } = useAuth();
  const { fincaActiva } = useFinca();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isEdit = !!empleadoId;

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [fnac, setFnac] = useState("");
  const [fingreso, setFingreso] = useState("");
  const [fsalida, setFsalida] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [fotoActual, setFotoActual] = useState<string | null>(null);
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
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
        setFsalida(data.fecha_salida ?? "");
        setNotas(data.notas ?? "");
        setActivo(data.activo ?? true);
        setFotoActual(data.foto_url ?? null);
        setFotoBlob(null);
        setFotoPreview(null);
      })();
    } else {
      setNombre("");
      setCedula("");
      setFnac("");
      setFingreso("");
      setFsalida("");
      setNotas("");
      setActivo(true);
      setFotoActual(null);
      setFotoBlob(null);
      setFotoPreview(null);
    }
  }, [open, empleadoId, onOpenChange]);

  const onActivoChange = (val: boolean) => {
    setActivo(val);
    if (!val && !fsalida) setFsalida(hoyISO());
    if (val) setFsalida("");
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropFile(f);
    e.target.value = "";
  };

  const handleCropConfirm = (blob: Blob) => {
    setFotoBlob(blob);
    setFotoPreview(URL.createObjectURL(blob));
    setCropFile(null);
  };

  const uploadFoto = async (empId: string, blob: Blob): Promise<string> => {
    const path = `${empId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("empleado-fotos")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("empleado-fotos").getPublicUrl(path);
    return data.publicUrl;
  };

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
      fecha_salida: fsalida,
      notas,
      activo,
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
        fecha_salida: parsed.data.fecha_salida || null,
        notas: parsed.data.notas || null,
        activo: parsed.data.activo,
      };

      let savedId = empleadoId ?? null;

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
        savedId = data.id;
        const { error: linkErr } = await supabase
          .from("empleado_fincas")
          .insert({
            empleado_id: data.id,
            finca_id: fincaActiva.id,
            created_by: user.id,
          });
        if (linkErr) throw linkErr;
      }

      if (fotoBlob && savedId) {
        try {
          const url = await uploadFoto(savedId, fotoBlob);
          const { error } = await supabase
            .from("empleados")
            .update({ foto_url: url })
            .eq("id", savedId);
          if (error) throw error;
        } catch (imgErr) {
          console.error(imgErr);
          toast.error("Empleado guardado, pero no se pudo subir la foto");
          await onSaved?.();
          return;
        }
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

  const photoSrc = fotoPreview ?? fotoActual;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar empleado" : "Nuevo empleado"}</SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : "Datos del empleado"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          {/* Foto */}
          <section className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
            <div className="w-20 h-20 rounded-full border-[3px] border-gold bg-background overflow-hidden flex items-center justify-center shrink-0">
              {photoSrc ? (
                <img src={photoSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-9 w-9 text-gold-deep" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Foto del empleado</p>
              <p className="text-xs text-muted-foreground">Opcional. Recorte cuadrado.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickImage}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1" />
                {photoSrc ? "Cambiar" : "Añadir"}
              </Button>
            </div>
          </section>

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

          {/* Activo / fecha salida */}
          <section className="rounded-lg border border-border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Empleado activo</p>
                <p className="text-xs text-muted-foreground">
                  Si lo desactivas, se mostrará en gris en la lista.
                </p>
              </div>
              <Switch checked={activo} onCheckedChange={onActivoChange} aria-label="Activo" />
            </div>
            {!activo && (
              <div>
                <Label htmlFor="fsal">F. salida</Label>
                <Input
                  id="fsal"
                  type="date"
                  value={fsalida}
                  onChange={(e) => setFsalida(e.target.value)}
                />
              </div>
            )}
          </section>

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </SheetContent>

      <ImageCropDialog
        open={!!cropFile}
        file={cropFile}
        aspect={1}
        outputSize={{ width: 512, height: 512 }}
        label="Foto del empleado"
        onConfirm={handleCropConfirm}
        onCancel={() => setCropFile(null)}
      />
    </Sheet>
  );
};

export default EmpleadoForm;
