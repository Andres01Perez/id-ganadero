import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssetDropzone from "@/components/AssetDropzone";
import ImageCropDialog from "@/components/ImageCropDialog";
import { useAllAppAssets } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS, fincaAssetKey } from "@/lib/asset-keys";
import { toast } from "sonner";
import { Upload } from "lucide-react";

type Finca = { id: string; nombre: string; foto_url: string | null };

type AssetItem = {
  key: string;
  label: string;
  aspect: number;
  output: { width: number; height: number };
};

const SQUARE = { aspect: 1, output: { width: 512, height: 512 } };
const BANNER = { aspect: 865 / 503, output: { width: 1600, height: 930 } };
const HERO = { aspect: 3 / 4, output: { width: 1200, height: 1600 } };
const FINCA = { aspect: 16 / 10, output: { width: 1280, height: 800 } };

const menuItems: AssetItem[] = [
  { key: ASSET_KEYS.iconFincas, label: "Icono · Fincas", ...SQUARE },
  { key: ASSET_KEYS.iconMachos, label: "Icono · Machos", ...SQUARE },
  { key: ASSET_KEYS.iconHembras, label: "Icono · Hembras", ...SQUARE },
  { key: ASSET_KEYS.iconCrias, label: "Icono · Crías", ...SQUARE },
  { key: ASSET_KEYS.iconEmbriones, label: "Icono · Embriones", ...SQUARE },
  { key: ASSET_KEYS.iconOtros, label: "Icono · Otros", ...SQUARE },
];

const brandItems: AssetItem[] = [
  { key: ASSET_KEYS.logo, label: "Logo JPS", ...SQUARE },
  { key: ASSET_KEYS.loginHero, label: "Hero del login", ...HERO },
  { key: ASSET_KEYS.menuBanner, label: "Banner del menú", ...BANNER },
];

const categoryBanners: AssetItem[] = [
  { key: ASSET_KEYS.bannerMachos, label: "Banner · Machos", ...BANNER },
  { key: ASSET_KEYS.bannerHembras, label: "Banner · Hembras", ...BANNER },
  { key: ASSET_KEYS.bannerCrias, label: "Banner · Crías", ...BANNER },
  { key: ASSET_KEYS.bannerEmbriones, label: "Banner · Embriones", ...BANNER },
];

const Imagenes = () => {
  const { data: assets, refetch } = useAllAppAssets();
  const [fincas, setFincas] = useState<Finca[]>([]);

  const loadFincas = async () => {
    const { data } = await supabase
      .from("fincas")
      .select("id, nombre, foto_url")
      .eq("activo", true)
      .order("nombre");
    setFincas(data ?? []);
  };

  useEffect(() => {
    loadFincas();
  }, []);

  const url = (key: string) => assets?.[key] ?? "";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Imágenes</h1>
        <p className="text-sm text-muted-foreground">
          Reemplaza cualquier imagen de la app. Cambios visibles al instante en
          todas las pantallas.
        </p>
      </div>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList>
          <TabsTrigger value="menu">Menú principal</TabsTrigger>
          <TabsTrigger value="brand">Marca · Banners</TabsTrigger>
          <TabsTrigger value="fincas">Fotos de fincas</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((it) => (
              <AssetDropzone
                key={it.key}
                assetKey={it.key}
                label={it.label}
                currentUrl={url(it.key)}
                fallbackUrl={ASSET_FALLBACKS[it.key]}
                onChanged={refetch}
                cropAspect={it.aspect}
                outputSize={it.output}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="mt-6 space-y-8">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandItems.map((it) => (
                <AssetDropzone
                  key={it.key}
                  assetKey={it.key}
                  label={it.label}
                  currentUrl={url(it.key)}
                  fallbackUrl={ASSET_FALLBACKS[it.key]}
                  onChanged={refetch}
                  cropAspect={it.aspect}
                  outputSize={it.output}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Banners de categorías</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Imagen de cabecera de las vistas /machos, /hembras, /crías y /embriones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBanners.map((it) => (
                <AssetDropzone
                  key={it.key}
                  assetKey={it.key}
                  label={it.label}
                  currentUrl={url(it.key)}
                  fallbackUrl={ASSET_FALLBACKS[it.key]}
                  onChanged={refetch}
                  cropAspect={it.aspect}
                  outputSize={it.output}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fincas" className="mt-6">
          {fincas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay fincas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fincas.map((f) => (
                <FincaPhotoCard key={f.id} finca={f} onChanged={loadFincas} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const FincaPhotoCard = ({
  finca,
  onChanged,
}: {
  finca: Finca;
  onChanged: () => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handlePicked = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Debe ser imagen");
      return;
    }
    setPendingFile(file);
  };

  const uploadBlob = async (blob: Blob) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const path = `${fincaAssetKey(finca.id)}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("app-assets")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("app-assets").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("fincas")
        .update({ foto_url: pub.publicUrl })
        .eq("id", finca.id);
      if (dbErr) throw dbErr;
      toast.success(`Foto de "${finca.nombre}" actualizada`);
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="font-semibold text-sm mb-3">{finca.nombre}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handlePicked(f);
        }}
        onClick={() => {
          const inp = document.createElement("input");
          inp.type = "file";
          inp.accept = "image/*";
          inp.onchange = () => inp.files?.[0] && handlePicked(inp.files[0]);
          inp.click();
        }}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all overflow-hidden ${
          dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
        }`}
        style={{ aspectRatio: "16/10" }}
      >
        {finca.foto_url ? (
          <img src={finca.foto_url} alt={finca.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            Sin foto
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center text-transparent hover:text-white text-xs">
          {uploading ? "Subiendo…" : (
            <span className="flex items-center gap-1.5">
              <Upload className="h-4 w-4" /> Click o arrastra
            </span>
          )}
        </div>
      </div>

      <ImageCropDialog
        open={!!pendingFile}
        file={pendingFile}
        aspect={FINCA.aspect}
        outputSize={FINCA.output}
        label={finca.nombre}
        onConfirm={uploadBlob}
        onCancel={() => setPendingFile(null)}
      />
    </div>
  );
};

export default Imagenes;
