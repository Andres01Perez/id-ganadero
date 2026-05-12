import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Minus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { toast } from "sonner";
import InventarioProductoForm from "@/components/InventarioProductoForm";
import MovimientoDialog from "@/components/MovimientoDialog";
import UrgenciaBadge from "@/components/UrgenciaBadge";
import {
  CATEGORIA_LABEL,
  IMPORTANCIA_LABEL,
  calcularStock,
  calcularUrgencia,
  type Categoria,
  type Importancia,
} from "@/lib/inventario";

type Producto = {
  id: string;
  nombre: string;
  categoria: Categoria;
  punto_minimo: number;
  importancia: Importancia;
  fecha_vencimiento: string | null;
  notas: string | null;
  marca: string | null;
  tipo_alimento: string | null;
  laboratorio: string | null;
  via_administracion: string | null;
  ubicacion: string | null;
  unidades_medida: { abreviatura: string | null; nombre: string } | null;
};

type Movimiento = {
  id: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  fecha: string;
  notas: string | null;
};

const InventarioProducto = () => {
  const { id, fincaId } = useParams<{ id: string; fincaId: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [movOpen, setMovOpen] = useState<null | "entrada" | "salida">(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: p, error: pe }, { data: m }] = await Promise.all([
      supabase
        .from("inventario_productos")
        .select(
          "id, nombre, categoria, punto_minimo, importancia, fecha_vencimiento, notas, marca, tipo_alimento, laboratorio, via_administracion, ubicacion, unidades_medida(abreviatura, nombre)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("inventario_movimientos")
        .select("id, tipo, cantidad, fecha, notas")
        .eq("producto_id", id)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (pe || !p) {
      toast.error("No se encontró el producto");
      navigate(-1);
      return;
    }
    setProducto(p as unknown as Producto);
    setMovs(
      ((m ?? []) as Movimiento[]).map((x) => ({ ...x, cantidad: Number(x.cantidad) })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!producto) return;
    if (!confirm("¿Eliminar este producto y todos sus movimientos?")) return;
    const { error } = await supabase
      .from("inventario_productos")
      .delete()
      .eq("id", producto.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Producto eliminado");
    navigate(`/finca/${fincaId}/inventario/${producto.categoria}`);
  };

  if (loading || !producto) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const stock = calcularStock(movs);
  const urg = calcularUrgencia(stock, producto.punto_minimo, producto.fecha_vencimiento);
  const abrev = producto.unidades_medida?.abreviatura || producto.unidades_medida?.nombre || "";

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate(`/finca/${fincaId}/inventario/${producto.categoria}`)}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none truncate px-12">
          {producto.nombre}
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Stock card */}
        <div className="bg-card rounded-xl p-4 shadow-soft text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <p className="text-xs uppercase tracking-jps text-muted-foreground">Stock actual</p>
            <UrgenciaBadge urgencia={urg} />
          </div>
          <p className="text-4xl font-bold text-ink">
            {stock} <span className="text-base text-muted-foreground font-medium">{abrev}</span>
          </p>
          {producto.punto_minimo > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Punto mínimo: {producto.punto_minimo} {abrev}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMovOpen("entrada")}
            className="bg-emerald-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" /> Entrada
          </button>
          <button
            onClick={() => setMovOpen("salida")}
            className="bg-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Minus className="h-5 w-5" /> Salida
          </button>
        </div>

        {/* Detalles */}
        <div className="bg-card rounded-xl p-4 shadow-soft space-y-2 text-sm">
          <Detail label="Categoría" value={CATEGORIA_LABEL[producto.categoria]} />
          <Detail label="Unidad" value={producto.unidades_medida?.nombre ?? ""} />
          <Detail label="Importancia" value={IMPORTANCIA_LABEL[producto.importancia]} />
          {producto.fecha_vencimiento && (
            <Detail label="Vence" value={producto.fecha_vencimiento} />
          )}
          {producto.marca && <Detail label="Marca" value={producto.marca} />}
          {producto.tipo_alimento && <Detail label="Tipo de alimento" value={producto.tipo_alimento} />}
          {producto.laboratorio && <Detail label="Laboratorio" value={producto.laboratorio} />}
          {producto.via_administracion && (
            <Detail label="Vía" value={producto.via_administracion} />
          )}
          {producto.ubicacion && <Detail label="Ubicación" value={producto.ubicacion} />}
          {producto.notas && <Detail label="Notas" value={producto.notas} />}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2.5 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Pencil className="h-4 w-4" /> Editar
          </button>
          <button
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground rounded-lg py-2.5 px-4 font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Historial */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-jps text-muted-foreground mb-2 px-1">
            Historial
          </h2>
          {movs.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">
              Sin movimientos aún
            </p>
          ) : (
            <ul className="space-y-2">
              {movs.map((m) => (
                <li
                  key={m.id}
                  className="bg-card rounded-lg p-3 shadow-soft flex items-center gap-3"
                >
                  <span
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      m.tipo === "entrada"
                        ? "bg-emerald-600/15 text-emerald-700"
                        : "bg-red-600/15 text-red-700"
                    }`}
                  >
                    {m.tipo === "entrada" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {m.tipo === "entrada" ? "+" : "−"}
                      {m.cantidad} {abrev}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.fecha}
                      {m.notas ? ` · ${m.notas}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <InventarioProductoForm
        open={editOpen}
        onOpenChange={setEditOpen}
        categoria={producto.categoria}
        productoId={producto.id}
        onSaved={load}
      />

      {movOpen && (
        <MovimientoDialog
          open={!!movOpen}
          onOpenChange={(o) => !o && setMovOpen(null)}
          productoId={producto.id}
          productoNombre={producto.nombre}
          tipo={movOpen}
          stockActual={stock}
          unidadAbrev={abrev}
          onSaved={load}
        />
      )}

      <BottomTabBar />
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3">
    <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm text-ink font-medium text-right">{value}</span>
  </div>
);

export default InventarioProducto;
