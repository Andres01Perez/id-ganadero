import type { Urgencia } from "@/lib/inventario";

const STYLES: Record<Urgencia, string> = {
  critica: "bg-red-600 text-white",
  advertencia: "bg-amber-400 text-ink",
  ok: "bg-emerald-600 text-white",
};

const LABEL: Record<Urgencia, string> = {
  critica: "Crítico",
  advertencia: "Bajo",
  ok: "OK",
};

const UrgenciaBadge = ({ urgencia }: { urgencia: Urgencia }) => (
  <span
    className={`text-[10px] uppercase tracking-jps font-bold rounded-full px-2 py-0.5 ${STYLES[urgencia]}`}
  >
    {LABEL[urgencia]}
  </span>
);

export default UrgenciaBadge;
