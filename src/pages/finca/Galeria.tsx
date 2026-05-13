import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Image as ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFinca } from "@/contexts/FincaContext";
import { useAuth } from "@/hooks/useAuth";
import BottomTabBar from "@/components/BottomTabBar";
import FincaActivaChip from "@/components/FincaActivaChip";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Foto = {
  id: string;
  url: string;
  storage_path: string;
  subido_por: string;
  created_at: string;
};

const BUCKET = "galeria-finca";

const FincaGaleria = () => {
  const navigate = useNavigate();
  const { fincaId } = useParams<{ fincaId: string }>();
  const { fincaActiva } = useFinca();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(0);
  const [viewer, setViewer] = useState<Foto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Foto | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!fincaActiva) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("galeria_fotos")
      .select("id, url, storage_path, subido_por, created_at")
      .eq("finca_id", fincaActiva.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setFotos([]);
    } else {
      setFotos((data ?? []) as Foto[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fincaActiva?.id]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !fincaActiva || !user) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setUploading(arr.length);

    const uploads = arr.map(async (file) => {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${fincaActiva.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("galeria_fotos").insert({
          finca_id: fincaActiva.id,
          storage_path: path,
          url: pub.publicUrl,
          subido_por: user.id,
        });
        if (insErr) throw insErr;
        return true;
      } catch (e: any) {
        toast.error(`Error subiendo ${file.name}: ${e.message ?? e}`);
        return false;
      }
    });

    const results = await Promise.all(uploads);
    const ok = results.filter(Boolean).length;
    setUploading(0);
    if (ok > 0) {
      toast.success(`${ok} foto${ok > 1 ? "s" : ""} subida${ok > 1 ? "s" : ""}`);
      load();
    }
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };
  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  const canDelete = (f: Foto) => isAdmin || f.subido_por === user?.id;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const foto = confirmDelete;
    setConfirmDelete(null);
    setViewer(null);
    const { error: delDb } = await supabase.from("galeria_fotos").delete().eq("id", foto.id);
    if (delDb) {
      toast.error(delDb.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([foto.storage_path]);
    toast.success("Foto eliminada");
    setFotos((prev) => prev.filter((x) => x.id !== foto.id));
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <FincaActivaChip />
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate(`/finca/${fincaId}/menu-finca`)}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          Galería
        </span>
      </div>

      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={uploading > 0}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-[3px] border-gold bg-card py-5 shadow-soft active:scale-95 transition-transform disabled:opacity-50"
        >
          <Camera className="h-7 w-7 text-gold" />
          <span className="text-sm font-bold uppercase tracking-jps text-foreground">
            Tomar foto
          </span>
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={uploading > 0}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-[3px] border-gold bg-card py-5 shadow-soft active:scale-95 transition-transform disabled:opacity-50"
        >
          <ImageIcon className="h-7 w-7 text-gold" />
          <span className="text-sm font-bold uppercase tracking-jps text-foreground">
            Subir fotos
          </span>
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onCameraChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onGalleryChange}
      />

      {uploading > 0 && (
        <div className="px-4 mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Subiendo {uploading} foto{uploading > 1 ? "s" : ""}…
        </div>
      )}

      <div className="px-3 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : fotos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Aún no hay fotos. ¡Sube la primera!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {fotos.map((f) => (
              <button
                key={f.id}
                onClick={() => setViewer(f)}
                className="aspect-square overflow-hidden bg-muted rounded-md active:scale-95 transition-transform"
              >
                <img
                  src={f.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-3 text-white">
            <button
              onClick={() => setViewer(null)}
              className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            {canDelete(viewer) && (
              <button
                onClick={() => setConfirmDelete(viewer)}
                className="h-10 w-10 rounded-full bg-red-600/80 flex items-center justify-center"
                aria-label="Eliminar"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={viewer.url}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomTabBar />
    </div>
  );
};

export default FincaGaleria;
