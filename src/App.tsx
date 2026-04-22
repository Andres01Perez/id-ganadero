import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Admin from "./pages/Admin";
import PlaceholderPage from "./pages/PlaceholderPage";
import CategoriaAnimales from "./pages/CategoriaAnimales";
import HojaVidaAnimal from "./pages/HojaVidaAnimal";
import Fincas from "./pages/Fincas";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminLayout from "./pages/SuperAdmin/Layout";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";
import SuperAdminUsuarios from "./pages/SuperAdmin/Usuarios";
import SuperAdminImagenes from "./pages/SuperAdmin/Imagenes";
import SuperAdminInformacionFinca from "./pages/SuperAdmin/InformacionFinca";
import SuperAdminGestion from "./pages/SuperAdmin/Gestion";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAppUpdate } from "./hooks/useAppUpdate";
import SafeAreaTopBar from "./components/SafeAreaTopBar";

const queryClient = new QueryClient();

const AppUpdateWatcher = () => {
  useAppUpdate();
  return null;
};

const ConditionalSafeArea = () => {
  const { pathname } = useLocation();
  // Oculto en panel superadmin (desktop-first)
  if (pathname.startsWith("/superadmin") || pathname === "/sa") return null;
  return <SafeAreaTopBar />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <AppUpdateWatcher />
      <BrowserRouter>
        <div className="flex flex-col min-h-[100dvh]">
          <ConditionalSafeArea />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sa" element={<SuperAdminLogin />} />

              {/* Panel Super Admin */}
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute requireRoles={["super_admin"]}>
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SuperAdminDashboard />} />
                <Route path="gestion" element={<SuperAdminGestion />} />
                <Route path="usuarios" element={<SuperAdminUsuarios />} />
                <Route path="imagenes" element={<SuperAdminImagenes />} />
                <Route path="finca" element={<SuperAdminInformacionFinca />} />
                <Route path="finca/:fincaId" element={<SuperAdminInformacionFinca />} />
              </Route>

              <Route
                path="/menu"
                element={
                  <ProtectedRoute>
                    <Menu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireRoles={["admin", "super_admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categoria/:tipo"
                element={
                  <ProtectedRoute>
                    <CategoriaAnimales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/animal/:id"
                element={
                  <ProtectedRoute>
                    <HojaVidaAnimal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fincas"
                element={
                  <ProtectedRoute>
                    <Fincas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generalidades"
                element={
                  <ProtectedRoute>
                    <PlaceholderPage title="Generalidades" />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
