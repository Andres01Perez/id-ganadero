import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Minus, Plus } from "lucide-react";

type Props = {
  open: boolean;
  file: File | null;
  aspect: number;
  outputSize: { width: number; height: number };
  label: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

const formatLabel = (aspect: number) => {
  if (Math.abs(aspect - 1) < 0.01) return "Formato: cuadrado (1:1)";
  if (Math.abs(aspect - 16 / 10) < 0.01) return "Formato: panorámico (16:10)";
  if (Math.abs(aspect - 3 / 4) < 0.01) return "Formato: vertical (3:4)";
  if (Math.abs(aspect - 865 / 503) < 0.01) return "Formato: banner panorámico";
  return `Formato: ${aspect.toFixed(2)}:1`;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

const cropToBlob = (
  imageSrc: string,
  cropPixels: Area,
  outputSize: { width: number; height: number }
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Sin contexto canvas"));
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        outputSize.width,
        outputSize.height
      );
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Falló blob"))),
        "image/jpeg",
        0.85
      );
    };
    img.src = imageSrc;
  });

const ImageCropDialog = ({
  open,
  file,
  aspect,
  outputSize,
  label,
  onConfirm,
  onCancel,
}: Props) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    let cancelled = false;
    readFileAsDataUrl(file).then((src) => {
      if (!cancelled) {
        setImageSrc(src);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await cropToBlob(imageSrc, croppedAreaPixels, outputSize);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !processing) onCancel();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ajustar imagen · {label}</DialogTitle>
          <DialogDescription>{formatLabel(aspect)}</DialogDescription>
        </DialogHeader>

        <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ height: 420 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando…
              </>
            ) : (
              "Recortar y subir"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
