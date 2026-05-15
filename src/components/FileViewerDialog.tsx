import { useState } from "react";
import { X, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FileViewerDialogProps = {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
};

const FileViewerDialog = ({
  open,
  onClose,
  fileUrl,
  fileName,
  mimeType,
}: FileViewerDialogProps) => {
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const isImage = !!mimeType && mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf" || /\.pdf($|\?)/i.test(fileUrl);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("No se pudo descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Fallback: open in new tab
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      toast.message("Descarga iniciada en una nueva pestaña");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-2 py-2 bg-black text-white border-b border-white/10"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full flex items-center justify-center active:scale-95 hover:bg-white/10"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="flex-1 text-sm font-medium truncate text-center px-1">
          {fileName}
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="h-10 w-10 rounded-full flex items-center justify-center active:scale-95 hover:bg-white/10 disabled:opacity-50"
          aria-label="Descargar"
        >
          {downloading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden bg-black">
        {isImage ? (
          <div
            className="w-full h-full overflow-auto flex items-center justify-center"
            style={{ touchAction: "pinch-zoom" }}
          >
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={fileUrl}
            title={fileName}
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/80 px-6 text-center">
            <FileText className="h-16 w-16 opacity-60" />
            <p className="text-sm break-all">{fileName}</p>
            <button
              onClick={handleDownload}
              className="bg-white text-black rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewerDialog;
