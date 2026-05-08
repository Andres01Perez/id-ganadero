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
import AnimalSeguimiento from "./pages/AnimalSeguimiento";
import Fincas from "./pages/Fincas";
import MenuFinca from "./pages/MenuFinca";
import FincaEmpleados from "./pages/finca/Empleados";
import FincaPotreros from "./pages/finca/Potreros";
import FincaAnimales from "./pages/finca/Animales";
import Otros from "./pages/Otros";
import GanadoInactivo from "./pages/otros/GanadoInactivo";
import Movimientos from "./pages/otros/Movimientos";
import CategoriaInventario from "./pages/CategoriaInventario";
import InventarioLista from "./pages/InventarioLista";
import InventarioProducto from "./pages/InventarioProducto";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminLayout from "./pages/SuperAdmin/Layout";
import SuperAdminDashboard from "./pages/SuperAdmin/Dashboard";
import SuperAdminUsuarios from "./pages/SuperAdmin/Usuarios";
import SuperAdminImagenes from "./pages/SuperAdmin/Imagenes";
import SuperAdminInformacionFinca from "./pages/SuperAdmin/InformacionFinca";
import SuperAdminGestion from "./pages/SuperAdmin/Gestion";
import { AuthProvider } from "./hooks/useAuth";
import { FincaProvider } from "./contexts/FincaContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireFinca from "./components/RequireFinca";
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
            <FincaProvider>
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
                    <RequireFinca>
                      <Menu />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/menu-finca"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <MenuFinca />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finca/empleados"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <FincaEmpleados />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finca/potreros"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <FincaPotreros />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finca/animales"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <FincaAnimales />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categoria-inventario"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <CategoriaInventario />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventario/:categoria"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <InventarioLista />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventario/producto/:id"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <InventarioProducto />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/otros"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <Otros />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/otros/ganado-inactivo"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <GanadoInactivo />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/otros/movimientos"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <Movimientos />
                    </RequireFinca>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finca/:modulo"
                element={
                  <ProtectedRoute>
                    <RequireFinca>
                      <PlaceholderPage title="Módulo de finca" />
                    </RequireFinca>
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
                    <RequireFinca>
                      <CategoriaAnimales />
                    </RequireFinca>
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
                path="/animal/:id/seguimiento/:tipo"
                element={
                  <ProtectedRoute>
                    <AnimalSeguimiento />
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
            </FincaProvider>
          </AuthProvider>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
