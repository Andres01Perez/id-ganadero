import { Navigate } from "react-router-dom";
import { useFinca } from "@/contexts/FincaContext";

const RequireFinca = ({ children }: { children: React.ReactNode }) => {
  const { fincaActiva, loading } = useFinca();

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-foreground/60 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!fincaActiva) return <Navigate to="/fincas" replace />;
  return <>{children}</>;
};

export default RequireFinca;
