import { useState } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
};

const FileActionDialog = ({ open, onOpenChange, fileUrl, fileName }: Props) => {
  const [downloading, setDownloading] = useState(false);

  const handleView = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

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
      toast.success("Descarga iniciada");
      onOpenChange(false);
    } catch {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      toast.message("Abierto en una nueva pestaña");
      onOpenChange(false);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate text-base">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleView}
            className="w-full bg-gold-solid text-ink rounded-xl py-3 font-semibold uppercase tracking-wider shadow-gold active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Eye className="h-5 w-5" />
            Ver archivo
          </button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full h-12 rounded-xl"
          >
            {downloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileActionDialog;
