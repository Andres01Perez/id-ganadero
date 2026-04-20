import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "jps_assets_v1";

const readCache = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeCache = (map: Record<string, string>) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
};

export const setAssetCache = (key: string, url: string) => {
  const map = readCache();
  if (map[key] === url) return;
  map[key] = url;
  writeCache(map);
};

const removeAssetCache = (key: string) => {
  const map = readCache();
  if (!(key in map)) return;
  delete map[key];
  writeCache(map);
};

/**
 * Devuelve la URL de un asset reemplazable. Si no hay override en la tabla
 * `app_assets`, usa el `fallback` (típicamente un import estático).
 *
 * Persiste el último valor conocido en localStorage para evitar el "flash"
 * de imagen vieja → nueva al cargar/navegar.
 */
export const useAppAsset = (key: string, fallback: string): string => {
  const [synced] = useState<string>(() => readCache()[key] ?? fallback);

  const { data } = useQuery({
    queryKey: ["app_asset", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_assets")
        .select("url")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return data?.url ?? null;
    },
    initialData: () => {
      const cached = readCache()[key];
      return cached ?? undefined;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (data) {
      setAssetCache(key, data);
    } else if (data === null) {
      removeAssetCache(key);
    }
  }, [key, data]);

  return data ?? synced ?? fallback;
};

/** Precarga todos los assets editables en una sola query (para superadmin). */
export const useAllAppAssets = () => {
  return useQuery({
    queryKey: ["app_assets_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_assets")
        .select("key, url, updated_at");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        map[row.key] = row.url;
      });
      // Sync localStorage snapshot completo
      writeCache(map);
      return map;
    },
    staleTime: 60 * 1000,
  });
};

export const useInvalidateAsset = () => {
  const qc = useQueryClient();
  return (key: string) => {
    qc.invalidateQueries({ queryKey: ["app_asset", key] });
    qc.invalidateQueries({ queryKey: ["app_assets_all"] });
  };
};
