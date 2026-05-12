import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import InventarioProductoForm from "@/components/InventarioProductoForm";
import UrgenciaBadge from "@/components/UrgenciaBadge";
import {
  CATEGORIA_LABEL,
  calcularStock,
  calcularUrgencia,
  ordenarPorUrgencia,
  type Categoria,
  type Importancia,
} from "@/lib/inventario";

type ProductoRow = {
  id: string;
  nombre: string;
  punto_minimo: number;
  importancia: Importancia;
  fecha_vencimiento: string | null;
  unidades_medida: { abreviatura: string | null; nombre: string } | null;
  stock: number;
};

const VALID: Categoria[] = ["alimentacion", "medicina", "otros"];

const InventarioLista = () => {
  const { categoria, fincaId } = useParams<{ categoria: string; fincaId: string }>();
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const cat = (VALID.includes(categoria as Categoria) ? categoria : "alimentacion") as Categoria;

  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data: prods, error } = await supabase
      .from("inventario_productos")
      .select(
        "id, nombre, punto_minimo, importancia, fecha_vencimiento, unidades_medida(abreviatura, nombre)",
      )
      .eq("finca_id", fincaActiva.id)
      .eq("categoria", cat)
      .eq("activo", true)
      .order("nombre");
    if (error) {
      toast.error(error.message);
      setProductos([]);
      setLoading(false);
      return;
    }
    const ids = (prods ?? []).map((p) => p.id);
    let stockMap = new Map<string, number>();
    if (ids.length) {
      const { data: movs } = await supabase
        .from("inventario_movimientos")
        .select("producto_id, tipo, cantidad")
        .in("producto_id", ids);
      const grouped = new Map<string, { tipo: "entrada" | "salida"; cantidad: number }[]>();
      (movs ?? []).forEach((m) => {
        const arr = grouped.get(m.producto_id) ?? [];
        arr.push({ tipo: m.tipo as "entrada" | "salida", cantidad: Number(m.cantidad) });
        grouped.set(m.producto_id, arr);
      });
      ids.forEach((id) => stockMap.set(id, calcularStock(grouped.get(id) ?? [])));
    }
    const enriched: ProductoRow[] = (prods ?? []).map((p) => ({
      ...(p as Omit<ProductoRow, "stock">),
      stock: stockMap.get(p.id) ?? 0,
    }));
    setProductos(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, fincaActiva?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? productos.filter((p) => p.nombre.toLowerCase().includes(q))
      : productos;
    return ordenarPorUrgencia(base);
  }, [productos, query]);

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate(`/finca/${fincaId}/inventario`)}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {CATEGORIA_LABEL[cat]}
        </span>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto"
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {productos.length === 0 ? "No hay productos en esta categoría" : "Sin resultados"}
            </p>
            <p className="text-xs text-muted-foreground mt-2 px-6">
              Toca el botón + para agregar el primero.
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const u = calcularUrgencia(p.stock, p.punto_minimo, p.fecha_vencimiento);
            const abrev = p.unidades_medida?.abreviatura || p.unidades_medida?.nombre || "";
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/finca/${fincaId}/inventario/producto/${p.id}`)}
                className="w-full flex items-center gap-4 bg-card rounded-xl p-3 shadow-soft active:scale-[0.99] transition-transform text-left"
              >
                <div className="w-12 h-12 rounded-full border-[3px] border-gold bg-card flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6 text-gold-deep" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base text-ink leading-tight truncate">
                      {p.nombre}
                    </p>
                    <UrgenciaBadge urgencia={u} />
                  </div>
                  <p className="text-xs text-muted-foreground tracking-wide">
                    Stock: <span className="font-semibold text-foreground">{p.stock}</span> {abrev}
                    {p.punto_minimo > 0 ? ` · mín. ${p.punto_minimo}` : ""}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-gold-solid text-ink shadow-gold flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label="Agregar"
      >
        <Plus className="h-6 w-6" />
      </button>

      <InventarioProductoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        categoria={cat}
        onSaved={load}
      />

      <BottomTabBar />
    </div>
  );
};

export default InventarioLista;
