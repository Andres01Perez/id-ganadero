import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wheat, Stethoscope, Wrench, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { calcularStock, calcularUrgencia, type Categoria } from "@/lib/inventario";

type Item = {
  label: string;
  to: Categoria;
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { label: "Alimentación", to: "alimentacion", icon: Wheat },
  { label: "Medicina", to: "medicina", icon: Stethoscope },
  { label: "Otros", to: "otros", icon: Wrench },
];

const CategoriaInventario = () => {
  const navigate = useNavigate();
  const { fincaActiva } = useFinca();
  const [criticos, setCriticos] = useState<Record<Categoria, number>>({
    alimentacion: 0,
    medicina: 0,
    otros: 0,
  });

  useEffect(() => {
    if (!fincaActiva) return;
    (async () => {
      const { data: productos } = await supabase
        .from("inventario_productos")
        .select("id, categoria, punto_minimo, fecha_vencimiento")
        .eq("finca_id", fincaActiva.id)
        .eq("activo", true);
      if (!productos?.length) {
        setCriticos({ alimentacion: 0, medicina: 0, otros: 0 });
        return;
      }
      const ids = productos.map((p) => p.id);
      const { data: movs } = await supabase
        .from("inventario_movimientos")
        .select("producto_id, tipo, cantidad")
        .in("producto_id", ids);
      const byProd = new Map<string, { tipo: "entrada" | "salida"; cantidad: number }[]>();
      (movs ?? []).forEach((m) => {
        const arr = byProd.get(m.producto_id) ?? [];
        arr.push({ tipo: m.tipo as "entrada" | "salida", cantidad: Number(m.cantidad) });
        byProd.set(m.producto_id, arr);
      });
      const result: Record<Categoria, number> = { alimentacion: 0, medicina: 0, otros: 0 };
      productos.forEach((p) => {
        const stock = calcularStock(byProd.get(p.id) ?? []);
        const u = calcularUrgencia(stock, Number(p.punto_minimo), p.fecha_vencimiento);
        if (u === "critica") result[p.categoria as Categoria]++;
      });
      setCriticos(result);
    })();
  }, [fincaActiva?.id]);

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate("/menu-finca")}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          Inventario
        </span>
      </div>

      <div className="px-6 py-10">
        <div className="grid grid-cols-1 gap-6 justify-items-center">
          {items.map((item) => {
            const Icon = item.icon;
            const crit = criticos[item.to];
            return (
              <button
                key={item.to}
                onClick={() => navigate(`/inventario/${item.to}`)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="relative w-32 h-32 rounded-full border-[3px] border-gold shadow-soft bg-card flex items-center justify-center">
                  <Icon className="h-14 w-14 text-gold-deep" />
                  {crit > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[28px] h-7 px-2 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {crit}
                    </span>
                  )}
                </div>
                <span className="text-base font-bold tracking-jps uppercase text-foreground">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default CategoriaInventario;
