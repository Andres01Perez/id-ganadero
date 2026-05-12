import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useFinca } from "@/contexts/FincaContext";

const RequireFinca = ({ children }: { children: React.ReactNode }) => {
  const { fincaId } = useParams<{ fincaId?: string }>();
  const { fincaActiva, fincasAccesibles, loading, setFincaActiva } = useFinca();

  // Sincroniza la finca activa con el parámetro de la URL
  useEffect(() => {
    if (loading || !fincaId) return;
    const match = fincasAccesibles.find((f) => f.id === fincaId);
    if (match && fincaActiva?.id !== fincaId) setFincaActiva(match);
  }, [fincaId, loading, fincasAccesibles, fincaActiva?.id, setFincaActiva]);

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-foreground/60 text-sm">Cargando…</div>
      </div>
    );
  }

  if (fincaId) {
    const match = fincasAccesibles.find((f) => f.id === fincaId);
    if (!match) return <Navigate to="/fincas" replace />;
  } else if (!fincaActiva) {
    return <Navigate to="/fincas" replace />;
  }
  return <>{children}</>;
};

export default RequireFinca;
