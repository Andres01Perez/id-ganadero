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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnidadMedidaSelect from "./UnidadMedidaSelect";
import { CATEGORIA_LABEL, IMPORTANCIA_LABEL, type Categoria, type Importancia } from "@/lib/inventario";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: Categoria;
  productoId?: string | null;
  onSaved?: () => void | Promise<void>;
};

const schema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(120),
  unidad_id: z.string().uuid("Selecciona una unidad"),
  punto_minimo: z.number().min(0, "No puede ser negativo"),
  importancia: z.enum(["estandar", "baja", "media", "alta"]),
});

const InventarioProductoForm = ({ open, onOpenChange, categoria, productoId, onSaved }: Props) => {
  const { user } = useAuth();
  const { fincaActiva } = useFinca();
  const isEdit = !!productoId;

  const [nombre, setNombre] = useState("");
  const [unidadId, setUnidadId] = useState("");
  const [puntoMinimo, setPuntoMinimo] = useState("0");
  const [importancia, setImportancia] = useState<Importancia>("estandar");
  const [fechaVenc, setFechaVenc] = useState("");
  const [notas, setNotas] = useState("");
  const [marca, setMarca] = useState("");
  const [tipoAlimento, setTipoAlimento] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [viaAdmin, setViaAdmin] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (productoId) {
      (async () => {
        const { data, error } = await supabase
          .from("inventario_productos")
          .select("*")
          .eq("id", productoId)
          .maybeSingle();
        if (error || !data) {
          toast.error("No se pudo cargar");
          onOpenChange(false);
          return;
        }
        setNombre(data.nombre ?? "");
        setUnidadId(data.unidad_id ?? "");
        setPuntoMinimo(String(data.punto_minimo ?? 0));
        setImportancia((data.importancia ?? "estandar") as Importancia);
        setFechaVenc(data.fecha_vencimiento ?? "");
        setNotas(data.notas ?? "");
        setMarca(data.marca ?? "");
        setTipoAlimento(data.tipo_alimento ?? "");
        setLaboratorio(data.laboratorio ?? "");
        setViaAdmin(data.via_administracion ?? "");
        setUbicacion(data.ubicacion ?? "");
      })();
    } else {
      setNombre("");
      setUnidadId("");
      setPuntoMinimo("0");
      setImportancia("estandar");
      setFechaVenc("");
      setNotas("");
      setMarca("");
      setTipoAlimento("");
      setLaboratorio("");
      setViaAdmin("");
      setUbicacion("");
      setCantidadInicial("");
    }
  }, [open, productoId, onOpenChange]);

  const handleSubmit = async () => {
    if (!user || !fincaActiva) return;
    const parsed = schema.safeParse({
      nombre,
      unidad_id: unidadId,
      punto_minimo: Number(puntoMinimo),
      importancia,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nombre: parsed.data.nombre,
        unidad_id: parsed.data.unidad_id,
        punto_minimo: parsed.data.punto_minimo,
        importancia: parsed.data.importancia,
        fecha_vencimiento: fechaVenc || null,
        notas: notas.trim() || null,
        marca: categoria === "alimentacion" ? marca.trim() || null : null,
        tipo_alimento: categoria === "alimentacion" ? tipoAlimento.trim() || null : null,
        laboratorio: categoria === "medicina" ? laboratorio.trim() || null : null,
        via_administracion: categoria === "medicina" ? viaAdmin.trim() || null : null,
        ubicacion: categoria === "otros" ? ubicacion.trim() || null : null,
      };
      if (isEdit && productoId) {
        const { error } = await supabase
          .from("inventario_productos")
          .update(payload)
          .eq("id", productoId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("inventario_productos")
          .insert({
            ...payload,
            finca_id: fincaActiva.id,
            categoria,
            created_by: user.id,
          })
          .select("id")
          .single();
        if (error) throw error;
        const qty = Number(cantidadInicial);
        if (created?.id && cantidadInicial.trim() !== "" && !Number.isNaN(qty) && qty > 0) {
          const { error: movErr } = await supabase.from("inventario_movimientos").insert({
            producto_id: created.id,
            tipo: "entrada",
            cantidad: qty,
            fecha: new Date().toISOString().slice(0, 10),
            notas: "Cantidad inicial",
            responsable_id: user.id,
          });
          if (movErr) {
            console.error(movErr);
            toast.warning("Producto creado, pero no se registró la cantidad inicial");
          }
        }
      }
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
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
    if (!productoId) return;
    if (!confirm("¿Eliminar este producto y todos sus movimientos?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("inventario_productos")
      .delete()
      .eq("id", productoId);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Producto eliminado");
    await onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar producto" : `Nuevo producto · ${CATEGORIA_LABEL[categoria]}`}
          </SheetTitle>
          <SheetDescription>
            {fincaActiva?.nombre ? `Finca: ${fincaActiva.nombre}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={
                categoria === "medicina"
                  ? "Ej. Oxitetraciclina"
                  : categoria === "alimentacion"
                  ? "Ej. Concentrado lechero"
                  : "Ej. Alambre de púas"
              }
            />
          </div>

          <div>
            <Label>Unidad de medida *</Label>
            <UnidadMedidaSelect value={unidadId} onChange={setUnidadId} />
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="ci">Cantidad inicial (opcional)</Label>
              <Input
                id="ci"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={cantidadInicial}
                onChange={(e) => setCantidadInicial(e.target.value)}
                placeholder="Deja vacío si aún no tienes existencias"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Si la ingresas, se registrará como una entrada hoy.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pm">Punto mínimo</Label>
              <Input
                id="pm"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={puntoMinimo}
                onChange={(e) => setPuntoMinimo(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Avisa cuando el stock llegue a este nivel.
              </p>
            </div>
            <div>
              <Label>Importancia</Label>
              <Select value={importancia} onValueChange={(v) => setImportancia(v as Importancia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["estandar", "baja", "media", "alta"] as Importancia[]).map((i) => (
                    <SelectItem key={i} value={i}>
                      {IMPORTANCIA_LABEL[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="fv">Fecha de vencimiento</Label>
            <Input
              id="fv"
              type="date"
              value={fechaVenc}
              onChange={(e) => setFechaVenc(e.target.value)}
            />
          </div>

          {categoria === "alimentacion" && (
            <>
              <div>
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ta">Tipo de alimento</Label>
                <Input
                  id="ta"
                  value={tipoAlimento}
                  onChange={(e) => setTipoAlimento(e.target.value)}
                  placeholder="Concentrado, sal mineralizada, heno…"
                />
              </div>
            </>
          )}

          {categoria === "medicina" && (
            <>
              <div>
                <Label htmlFor="lab">Laboratorio</Label>
                <Input id="lab" value={laboratorio} onChange={(e) => setLaboratorio(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="via">Vía de administración</Label>
                <Input
                  id="via"
                  value={viaAdmin}
                  onChange={(e) => setViaAdmin(e.target.value)}
                  placeholder="Oral, intramuscular, subcutánea…"
                />
              </div>
            </>
          )}

          {categoria === "otros" && (
            <div>
              <Label htmlFor="ub">Ubicación</Label>
              <Input
                id="ub"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Estantería del fondo, bodega 2…"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
            {isEdit && (
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "…" : "Eliminar"}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InventarioProductoForm;
