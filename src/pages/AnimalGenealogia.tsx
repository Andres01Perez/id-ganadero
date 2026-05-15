import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomTabBar from "@/components/BottomTabBar";
import FileViewerDialog from "@/components/FileViewerDialog";
import { toast } from "sonner";

type Doc = {
  id: string;
  file_url: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
};

const BUCKET = "animal-genealogia";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

const AnimalGenealogia = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<Doc | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("animal_genealogia")
      .select("id, file_url, storage_path, file_name, mime_type, uploaded_by, created_at")
      .eq("animal_id", id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length || !id || !user) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${id}/${Date.now()}-${safeName}`;
        const up = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
        if (up.error) throw up.error;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const ins = await supabase.from("animal_genealogia").insert({
          animal_id: id,
          file_url: pub.publicUrl,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          uploaded_by: user.id,
        });
        if (ins.error) throw ins.error;
        ok++;
      } catch (err) {
        const e = err as { message?: string };
        toast.error(e.message ?? "No se pudo subir el archivo");
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (ok > 0) {
      toast.success(`${ok} archivo${ok > 1 ? "s" : ""} subido${ok > 1 ? "s" : ""}`);
      load();
    }
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`¿Eliminar "${doc.file_name}"?`)) return;
    const del = await supabase.from("animal_genealogia").delete().eq("id", doc.id);
    if (del.error) {
      toast.error(del.error.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    toast.success("Eliminado");
    load();
  };

  const isImage = (m: string | null) => !!m && m.startsWith("image/");

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <div className="relative bg-gold-solid text-ink py-3 tracking-jps font-semibold uppercase text-base">
        <button
          onClick={() => navigate(`/animal/${id}`)}
          className="relative z-10 ml-2 h-8 w-8 rounded-full flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          Genealogía
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          Sube el certificado de ASOSEBÚ del animal en PDF o foto. Puedes cargar varios archivos.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="w-full bg-gold-solid text-ink rounded-xl py-3 font-semibold uppercase tracking-wider shadow-gold active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {uploading ? "Subiendo…" : "Subir archivo"}
        </button>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Cargando…</p>
        ) : docs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground px-6">
              Aún no hay documentos de genealogía. Sube el certificado de ASOSEBÚ en PDF o foto.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const canDelete = isAdmin || d.uploaded_by === user?.id;
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => setViewing(d)}
                    className="shrink-0 h-14 w-14 rounded-lg bg-muted overflow-hidden flex items-center justify-center active:scale-95"
                    aria-label={`Abrir ${d.file_name}`}
                  >
                    {isImage(d.mime_type) ? (
                      <img
                        src={d.file_url}
                        alt={d.file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-7 w-7 text-gold-deep" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewing(d)}
                    className="flex-1 min-w-0 text-left active:opacity-70"
                  >
                    <p className="font-semibold text-sm text-ink truncate">{d.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.created_at)}
                    </p>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(d)}
                      className="h-9 w-9 rounded-full flex items-center justify-center text-destructive active:scale-95"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomTabBar />

      <FileViewerDialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        fileUrl={viewing?.file_url ?? ""}
        fileName={viewing?.file_name ?? ""}
        mimeType={viewing?.mime_type ?? null}
      />
    </div>
  );
};

export default AnimalGenealogia;
