import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";

type Props = {
  children: React.ReactNode;
  requireRoles?: AppRole[];
};

const ProtectedRoute = ({ children, requireRoles }: Props) => {
  const { user, roles, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="text-foreground/60 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  // Si el usuario es super_admin y NO está en el panel /superadmin, redirigir.
  const isSuper = roles.includes("super_admin");
  const inSuperPanel = pathname.startsWith("/superadmin");
  if (isSuper && !inSuperPanel) {
    return <Navigate to="/superadmin" replace />;
  }

  if (requireRoles && requireRoles.length > 0) {
    const ok = roles.some((r) => requireRoles.includes(r));
    if (!ok) return <Navigate to="/menu" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
