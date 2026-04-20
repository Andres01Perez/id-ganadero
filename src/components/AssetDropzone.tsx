import { useRef, useState } from "react";
import { Upload, RotateCcw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resizeImage } from "@/lib/image";
import { toast } from "sonner";
import { useInvalidateAsset } from "@/hooks/useAppAsset";

type Props = {
  assetKey: string;
  currentUrl: string;
  fallbackUrl: string;
  label: string;
  onChanged?: () => void;
  /** Tamaño máximo del lado mayor de la imagen subida (px). */
  maxSize?: number;
  className?: string;
};

const AssetDropzone = ({
  assetKey,
  currentUrl,
  fallbackUrl,
  label,
  onChanged,
  maxSize = 1200,
  className = "",
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const invalidate = useInvalidateAsset();

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Debe ser una imagen");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImage(file, maxSize);
      const safeKey = assetKey.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${safeKey}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("app-assets")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("app-assets").getPublicUrl(path);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: dbErr } = await supabase.from("app_assets").upsert(
        {
          key: assetKey,
          url: pub.publicUrl,
          updated_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (dbErr) throw dbErr;
      toast.success("Imagen actualizada");
      invalidate(assetKey);
      onChanged?.();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error subiendo";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const reset = async () => {
    if (!confirm(`¿Restaurar la imagen original de "${label}"?`)) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from("app_assets")
        .delete()
        .eq("key", assetKey);
      if (error) throw error;
      toast.success("Restaurada al original");
      invalidate(assetKey);
      onChanged?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const display = currentUrl || fallbackUrl;
  const isOverridden = !!currentUrl;

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-semibold text-sm">{label}</p>
        {isOverridden && (
          <button
            onClick={reset}
            disabled={uploading}
            className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar
          </button>
        )}
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all overflow-hidden ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/60"
        }`}
        style={{ aspectRatio: "16/10" }}
      >
        {display ? (
          <img
            src={display}
            alt={label}
            className="w-full h-full object-contain bg-muted"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center text-transparent hover:text-white text-xs font-semibold">
          {uploading ? (
            <div className="bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" /> Subiendo…
            </div>
          ) : (
            <span className="flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              Click o arrastra una imagen
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>
      {isOverridden && (
        <p className="text-[10px] text-muted-foreground mt-2 truncate">
          Personalizada · {assetKey}
        </p>
      )}
    </div>
  );
};

export default AssetDropzone;
