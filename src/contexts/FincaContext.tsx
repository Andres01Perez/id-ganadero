import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FincaActiva = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  hectareas: number | null;
  foto_url: string | null;
};

type FincaContextValue = {
  fincaActiva: FincaActiva | null;
  fincasAccesibles: FincaActiva[];
  loading: boolean;
  setFincaActiva: (f: FincaActiva | null) => void;
  reloadFincas: () => Promise<FincaActiva[]>;
  clearFincaActiva: () => void;
};

const STORAGE_KEY = "jps_finca_activa_id";
const FincaContext = createContext<FincaContextValue | undefined>(undefined);

export const FincaProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [fincasAccesibles, setFincasAccesibles] = useState<FincaActiva[]>([]);
  const [fincaActiva, setFincaActivaState] = useState<FincaActiva | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (id: string | null) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  };

  const setFincaActiva = useCallback((f: FincaActiva | null) => {
    setFincaActivaState(f);
    persist(f?.id ?? null);
  }, []);

  const clearFincaActiva = useCallback(() => {
    setFincaActivaState(null);
    persist(null);
  }, []);

  const reloadFincas = useCallback(async () => {
    if (!user) {
      setFincasAccesibles([]);
      setFincaActivaState(null);
      return [];
    }
    const { data, error } = await supabase
      .from("fincas")
      .select("id, nombre, ubicacion, hectareas, foto_url")
      .eq("activo", true)
      .order("nombre");
    if (error) {
      setFincasAccesibles([]);
      return [];
    }
    const list = (data ?? []) as FincaActiva[];
    setFincasAccesibles(list);

    // Hidratar finca activa desde localStorage si sigue accesible
    let savedId: string | null = null;
    try {
      savedId = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setFincaActivaState((current) => {
      if (current && list.some((f) => f.id === current.id)) {
        // refrescar datos por si cambiaron
        return list.find((f) => f.id === current.id) ?? current;
      }
      if (savedId) {
        const match = list.find((f) => f.id === savedId);
        if (match) return match;
      }
      return null;
    });
    return list;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    reloadFincas().finally(() => setLoading(false));
  }, [authLoading, reloadFincas]);

  return (
    <FincaContext.Provider
      value={{
        fincaActiva,
        fincasAccesibles,
        loading,
        setFincaActiva,
        reloadFincas,
        clearFincaActiva,
      }}
    >
      {children}
    </FincaContext.Provider>
  );
};

export const useFinca = () => {
  const ctx = useContext(FincaContext);
  if (!ctx) throw new Error("useFinca debe usarse dentro de FincaProvider");
  return ctx;
};
