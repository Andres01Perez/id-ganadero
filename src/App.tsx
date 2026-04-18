import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Admin from "./pages/Admin";
import PlaceholderPage from "./pages/PlaceholderPage";
import CategoriaAnimales from "./pages/CategoriaAnimales";
import HojaVidaAnimal from "./pages/HojaVidaAnimal";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
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
                  <PlaceholderPage title="Fincas" />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
