import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssetDropzone from "@/components/AssetDropzone";
import { useAllAppAssets } from "@/hooks/useAppAsset";
import { ASSET_KEYS, ASSET_FALLBACKS, fincaAssetKey } from "@/lib/asset-keys";
import { resizeImage } from "@/lib/image";
import { toast } from "sonner";
import { Upload } from "lucide-react";

type Finca = { id: string; nombre: string; foto_url: string | null };

const menuItems = [
  { key: ASSET_KEYS.iconFincas, label: "Icono · Fincas" },
  { key: ASSET_KEYS.iconMachos, label: "Icono · Machos" },
  { key: ASSET_KEYS.iconHembras, label: "Icono · Hembras" },
  { key: ASSET_KEYS.iconCrias, label: "Icono · Crías" },
  { key: ASSET_KEYS.iconEmbriones, label: "Icono · Embriones" },
  { key: ASSET_KEYS.iconOtros, label: "Icono · Otros" },
];

const brandItems = [
  { key: ASSET_KEYS.logo, label: "Logo JPS" },
  { key: ASSET_KEYS.loginHero, label: "Hero del login" },
  { key: ASSET_KEYS.menuBanner, label: "Banner del menú" },
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
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandItems.map((it) => (
              <AssetDropzone
                key={it.key}
                assetKey={it.key}
                label={it.label}
                currentUrl={url(it.key)}
                fallbackUrl={ASSET_FALLBACKS[it.key]}
                onChanged={refetch}
                maxSize={1600}
              />
            ))}
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

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Debe ser imagen");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImage(file, 1200);
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
          if (f) upload(f);
        }}
        onClick={() => {
          const inp = document.createElement("input");
          inp.type = "file";
          inp.accept = "image/*";
          inp.onchange = () => inp.files?.[0] && upload(inp.files[0]);
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
    </div>
  );
};

export default Imagenes;
