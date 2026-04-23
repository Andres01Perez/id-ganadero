import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resizeImage } from "@/lib/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Trash2 } from "lucide-react";
import jpsLogo from "@/assets/jps-logo.webp";

type AnimalTipo = "macho" | "hembra" | "cria" | "embrion" | "otro";
type AnimalRaza = "Brahman";
type AnimalColor = "Gris" | "Rojo";

const RAZA_OPTIONS: AnimalRaza[] = ["Brahman"];
const COLOR_OPTIONS: AnimalColor[] = ["Gris", "Rojo"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: AnimalTipo;
  animalId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const schema = z.object({
  numero: z.string().trim().min(1, "Número obligatorio").max(40),
  nombre: z.string().trim().max(80).optional().or(z.literal("")),
  numero_registro: z.string().trim().max(40).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  sexo: z.enum(["M", "H"]).optional(),
  raza: z.enum(["Brahman"], { message: "Selecciona una raza válida" }),
  color: z.enum(["Gris", "Rojo"], { message: "Selecciona un color válido" }),
  finca_id: z.string().uuid("Debes seleccionar una finca"),
  madre_id: z.string().optional().or(z.literal("")),
  padre_id: z.string().optional().or(z.literal("")),
});

type Finca = { id: string; nombre: string };
type Parent = { id: string; numero: string; nombre: string | null };

const sexoFromTipo = (tipo: AnimalTipo): "M" | "H" | undefined => {
  if (tipo === "macho") return "M";
  if (tipo === "hembra") return "H";
  return undefined;
};

const AnimalForm = ({ open, onOpenChange, tipo, animalId, onSaved }: Props) => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isEdit = !!animalId;

  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroRegistro, setNumeroRegistro] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState<"M" | "H" | "">("");
  const [raza, setRaza] = useState<AnimalRaza | "">("Brahman");
  const [color, setColor] = useState<AnimalColor | "">("");
  const [fincaId, setFincaId] = useState("");
  const [madreId, setMadreId] = useState("");
  const [padreId, setPadreId] = useState("");
  const [createdBy, setCreatedBy] = useState<string | null>(null);
  const [fotoActualUrl, setFotoActualUrl] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [fincas, setFincas] = useState<Finca[]>([]);
  const [hembras, setHembras] = useState<Parent[]>([]);
  const [machos, setMachos] = useState<Parent[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSexo = tipo === "cria" || tipo === "embrion" || tipo === "otro";

  // Cargar selects (fincas filtradas según rol)
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      let fincasData: Finca[] = [];
      if (isAdmin) {
        const { data } = await supabase
          .from("fincas")
          .select("id, nombre")
          .eq("activo", true)
          .order("nombre");
        fincasData = data ?? [];
      } else {
        const { data: accesos } = await supabase
          .from("user_finca_acceso")
          .select("finca_id")
          .eq("user_id", user.id);
        const ids = (accesos ?? []).map((a) => a.finca_id);
        if (ids.length > 0) {
          const { data } = await supabase
            .from("fincas")
            .select("id, nombre")
            .eq("activo", true)
            .in("id", ids)
            .order("nombre");
          fincasData = data ?? [];
        }
      }
      const [h, m] = await Promise.all([
        supabase
          .from("animales")
          .select("id, numero, nombre")
          .eq("tipo", "hembra")
          .eq("activo", true)
          .order("numero"),
        supabase
          .from("animales")
          .select("id, numero, nombre")
          .eq("tipo", "macho")
          .eq("activo", true)
          .order("numero"),
      ]);
      setFincas(fincasData);
      setHembras(h.data ?? []);
      setMachos(m.data ?? []);
    })();
  }, [open, user, isAdmin]);

  // Cargar animal en modo edición / reset en creación
  useEffect(() => {
    if (!open) return;
    if (animalId) {
      (async () => {
        const { data, error } = await supabase
          .from("animales")
          .select("*")
          .eq("id", animalId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar el animal");
          onOpenChange(false);
          return;
        }
        setNumero(data.numero ?? "");
        setNombre(data.nombre ?? "");
        setNumeroRegistro(data.numero_registro ?? "");
        setFechaNacimiento(data.fecha_nacimiento ?? "");
        setSexo((data.sexo as "M" | "H" | null) ?? "");
        setRaza(data.raza === "Brahman" ? data.raza : "");
        setColor(data.color === "Gris" || data.color === "Rojo" ? data.color : "");
        setFincaId(data.finca_id ?? "");
        setMadreId(data.madre_id ?? "");
        setPadreId(data.padre_id ?? "");
        setCreatedBy(data.created_by ?? null);
        setFotoActualUrl(data.foto_principal_url ?? null);
        setFotoFile(null);
        setFotoPreview(null);
      })();
    } else {
      setNumero("");
      setNombre("");
      setNumeroRegistro("");
      setFechaNacimiento("");
      setSexo(sexoFromTipo(tipo) ?? "");
      setRaza("Brahman");
      setColor("");
      setFincaId("");
      setMadreId("");
      setPadreId("");
      setCreatedBy(null);
      setFotoActualUrl(null);
      setFotoFile(null);
      setFotoPreview(null);
    }
  }, [open, animalId, tipo, onOpenChange]);

  const canEdit = !isEdit || (createdBy && user?.id === createdBy) || isAdmin;
  const canDelete = isEdit && canEdit;

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));
  };

  const uploadFoto = async (id: string): Promise<string | null> => {
    if (!fotoFile) return null;
    const blob = await resizeImage(fotoFile, 800);
    const path = `${id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("animal-fotos")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("animal-fotos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    const sexoFinal = sexoFromTipo(tipo) ?? (sexo || undefined);
    const parsed = schema.safeParse({
      numero,
      nombre,
      numero_registro: numeroRegistro,
      fecha_nacimiento: fechaNacimiento,
      sexo: sexoFinal,
      raza,
      color,
      finca_id: fincaId,
      madre_id: madreId,
      padre_id: padreId,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        numero: parsed.data.numero,
        nombre: parsed.data.nombre || null,
        numero_registro: parsed.data.numero_registro || null,
        fecha_nacimiento: parsed.data.fecha_nacimiento || null,
        sexo: (parsed.data.sexo as "M" | "H" | undefined) ?? null,
        raza: parsed.data.raza || null,
        color: parsed.data.color || null,
        finca_id: parsed.data.finca_id || null,
        madre_id: parsed.data.madre_id || null,
        padre_id: parsed.data.padre_id || null,
        tipo,
      };

      let savedId = animalId ?? null;

      if (isEdit && animalId) {
        const { error } = await supabase
          .from("animales")
          .update(payload)
          .eq("id", animalId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("animales")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        savedId = data.id;
      }

      if (fotoFile && savedId) {
        const url = await uploadFoto(savedId);
        if (url) {
          await supabase
            .from("animales")
            .update({ foto_principal_url: url })
            .eq("id", savedId);
        }
      }

      toast.success(isEdit ? "Animal actualizado" : "Animal creado");
      await onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const e = err as { message?: string; code?: string };
      console.error(err);
      if (e.code === "23505") {
        toast.error("Ya existe un animal con ese número");
      } else {
        toast.error(e.message ?? "No se pudo guardar");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!animalId) return;
    if (!confirm("¿Desactivar este animal? Ya no aparecerá en la lista.")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("animales")
      .update({ activo: false })
      .eq("id", animalId);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo desactivar");
      return;
    }
    toast.success("Animal desactivado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar" : "Nuevo"} {tipo}
          </SheetTitle>
          <SheetDescription>
            Completa los datos. El número es obligatorio.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          {/* Foto */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-gold bg-white overflow-hidden flex items-center justify-center shrink-0">
              {fotoPreview ? (
                <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
              ) : fotoActualUrl ? (
                <img src={fotoActualUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <img src={jpsLogo} alt="" className="w-8 h-8 object-contain opacity-60" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFotoChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1" />
              {fotoActualUrl || fotoPreview ? "Cambiar foto" : "Añadir foto"}
            </Button>
          </div>

          <div>
            <Label htmlFor="numero">Número *</Label>
            <Input
              id="numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej. 0123"
            />
          </div>

          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="registro">Nº Registro</Label>
              <Input
                id="registro"
                value={numeroRegistro}
                onChange={(e) => setNumeroRegistro(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fnac">F. nacimiento</Label>
              <Input
                id="fnac"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
              />
            </div>
          </div>

          {showSexo && (
            <div>
              <Label htmlFor="sexo">Sexo</Label>
              <select
                id="sexo"
                value={sexo}
                onChange={(e) => setSexo(e.target.value as "M" | "H" | "")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">—</option>
                <option value="M">Macho</option>
                <option value="H">Hembra</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="raza">Raza</Label>
              <Select value={raza} onValueChange={(value) => setRaza(value as AnimalRaza)}>
                <SelectTrigger id="raza">
                  <SelectValue placeholder="Selecciona raza" />
                </SelectTrigger>
                <SelectContent>
                  {RAZA_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Select value={color} onValueChange={(value) => setColor(value as AnimalColor)}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Selecciona color" />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="finca">Finca *</Label>
            <select
              id="finca"
              value={fincaId}
              onChange={(e) => setFincaId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Selecciona una finca —</option>
              {fincas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
            {fincas.length === 0 && !isAdmin && (
              <p className="text-xs text-destructive mt-1">
                No tienes fincas asignadas. Pide a un admin que te asigne una.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="madre">Madre</Label>
            <select
              id="madre"
              value={madreId}
              onChange={(e) => setMadreId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Ninguna —</option>
              {hembras
                .filter((h) => h.id !== animalId)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.numero} {h.nombre ? `· ${h.nombre}` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label htmlFor="padre">Padre</Label>
            <select
              id="padre"
              value={padreId}
              onChange={(e) => setPadreId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Ninguno —</option>
              {machos
                .filter((m) => m.id !== animalId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.numero} {m.nombre ? `· ${m.nombre}` : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canEdit}
              className="bg-gold-solid text-ink hover:bg-gold-solid/90 h-12 text-base font-semibold"
            >
              {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
            {canDelete && (
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
            {!canEdit && isEdit && (
              <p className="text-xs text-muted-foreground text-center">
                Solo el creador o un admin puede editar este animal.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AnimalForm;
