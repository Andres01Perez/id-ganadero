import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Devuelve la URL de un asset reemplazable. Si no hay override en la tabla
 * `app_assets`, usa el `fallback` (típicamente un import estático).
 */
export const useAppAsset = (key: string, fallback: string): string => {
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
    staleTime: 5 * 60 * 1000,
  });
  return data ?? fallback;
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
