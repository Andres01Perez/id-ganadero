import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { useFinca } from "@/contexts/FincaContext";

const FincaActivaChip = () => {
  const navigate = useNavigate();
  const { fincaActiva, fincasAccesibles } = useFinca();
  if (!fincaActiva) return null;

  const puedeCambiar = fincasAccesibles.length > 1;

  return (
    <button
      type="button"
      onClick={() => puedeCambiar && navigate("/fincas")}
      disabled={!puedeCambiar}
      className="w-full flex items-center justify-center gap-2 bg-black/80 text-gold-soft text-xs py-2 px-3 border-b border-gold/30 active:bg-black/90 disabled:opacity-90"
      aria-label="Finca activa"
    >
      <MapPin className="h-3.5 w-3.5 text-gold" />
      <span className="font-semibold uppercase tracking-wider truncate max-w-[60%]">
        {fincaActiva.nombre}
      </span>
      {puedeCambiar && (
        <>
          <span className="text-gold/40">·</span>
          <span className="uppercase tracking-wider">Cambiar</span>
          <ChevronRight className="h-3 w-3" />
        </>
      )}
    </button>
  );
};

export default FincaActivaChip;
