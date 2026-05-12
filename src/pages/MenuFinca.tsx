import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useFinca } from "@/contexts/FincaContext";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { useAppAsset } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS } from "@/lib/asset-keys";
import imgEmpleados from "@/assets/menu-finca/empleados.webp";
import imgPotreros from "@/assets/menu-finca/potreros.webp";
import imgAnimales from "@/assets/menu-finca/animales.webp";
import imgInventario from "@/assets/menu-finca/inventario.webp";
import imgCompraVenta from "@/assets/menu-finca/compra-venta.webp";
import imgOtros from "@/assets/menu-finca/otros.webp";

type ModuloItem = {
  label: string;
  to?: string;
  image: string;
  disabled?: boolean;
};

const MenuFinca = () => {
  const navigate = useNavigate();
  const { fincaId } = useParams<{ fincaId: string }>();
  const { fincaActiva } = useFinca();
  const fallbackBanner = useAppAsset(ASSET_KEYS.bannerMenuFinca, ASSET_FALLBACKS[ASSET_KEYS.bannerMenuFinca]);
  const banner = fincaActiva?.foto_url || fallbackBanner;

  const items: ModuloItem[] = [
    { label: "Empleados", to: `/finca/${fincaId}/empleados`, image: imgEmpleados },
    { label: "Potreros", to: `/finca/${fincaId}/potreros`, image: imgPotreros },
    { label: "Animales", to: `/finca/${fincaId}/animales-finca`, image: imgAnimales },
    { label: "Inventario", to: `/finca/${fincaId}/inventario`, image: imgInventario },
    { label: "Compra/Venta", to: `/finca/${fincaId}/compra-venta`, image: imgCompraVenta },
    { label: "Otros", image: imgOtros, disabled: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <header className="relative aspect-[865/503] overflow-hidden">
        <img src={banner} alt={fincaActiva?.nombre ?? ""} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        <button
          onClick={() => navigate("/fincas")}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver a fincas"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      <div className="bg-gold-solid text-ink py-3 text-center tracking-jps font-semibold uppercase text-sm">
        Gestión de Finca
      </div>

      <div className="px-6 py-8">
        <div className="grid grid-cols-2 gap-y-7 gap-x-4 justify-items-center">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => !item.disabled && item.to && navigate(item.to)}
              disabled={item.disabled}
              className={`flex flex-col items-center gap-2 transition-transform ${
                item.disabled ? "opacity-40 cursor-not-allowed" : "active:scale-95"
              }`}
            >
              <div className="w-24 h-24 rounded-full border-[3px] border-gold shadow-soft bg-card overflow-hidden">
                <img
                  src={item.image}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-bold tracking-jps uppercase text-foreground">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default MenuFinca;
