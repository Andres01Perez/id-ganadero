import { ASSET_KEYS } from "@/lib/asset-keys";

type Props = {
  assetKey: string;
  imageUrl: string;
};

const Phone = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-[260px] h-[520px] rounded-[2rem] border-[6px] border-foreground/80 bg-background overflow-hidden shadow-2xl relative">
    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-foreground/80 rounded-full z-20" />
    <div className="w-full h-full overflow-hidden">{children}</div>
  </div>
);

const Bar = ({ className = "" }: { className?: string }) => (
  <div className={`h-2 rounded bg-muted-foreground/20 ${className}`} />
);

const HighlightImg = ({
  src,
  className,
  contain,
}: {
  src: string;
  className: string;
  contain?: boolean;
}) => (
  <div className={`relative ${className}`}>
    <img
      src={src}
      alt=""
      className={`w-full h-full ${contain ? "object-contain" : "object-cover"}`}
    />
    <div className="absolute inset-0 ring-2 ring-primary ring-offset-1 ring-offset-background rounded-[inherit] animate-pulse pointer-events-none" />
  </div>
);

const TopBar = ({ logoUrl, highlightLogo }: { logoUrl: string; highlightLogo?: boolean }) => (
  <div className="h-7 bg-foreground flex items-center justify-center pt-1">
    {highlightLogo ? (
      <div className="relative h-5 w-5 rounded-full overflow-hidden ring-2 ring-primary animate-pulse">
        <img src={logoUrl} alt="" className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="h-4 w-4 rounded-full overflow-hidden">
        <img src={logoUrl} alt="" className="w-full h-full object-cover" />
      </div>
    )}
  </div>
);

const BottomTabs = () => (
  <div className="absolute bottom-0 inset-x-0 h-9 bg-card border-t border-border flex items-center justify-around px-3">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="h-3 w-3 rounded-sm bg-muted-foreground/30" />
    ))}
  </div>
);

const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-muted-foreground text-center mt-3 px-4 leading-snug">
    {children}
  </p>
);

const MenuMock = ({
  imageUrl,
  highlightBanner,
  highlightIconIndex,
}: {
  imageUrl: string;
  highlightBanner?: boolean;
  highlightIconIndex?: number;
}) => (
  <Phone>
    {highlightBanner ? (
      <HighlightImg src={imageUrl} className="w-full aspect-[865/503]" />
    ) : (
      <div className="w-full aspect-[865/503] bg-muted" />
    )}
    <div className="bg-gold-solid h-4" />
    <div className="px-4 pt-3 grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => {
        const isHL = highlightIconIndex === i;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`h-10 w-10 rounded-full border-2 border-gold overflow-hidden bg-card ${
                isHL ? "ring-2 ring-primary animate-pulse" : ""
              }`}
            >
              {isHL ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>
            <div className="h-1.5 w-8 rounded bg-muted-foreground/20" />
          </div>
        );
      })}
    </div>
    <BottomTabs />
  </Phone>
);

const CategoryListMock = ({ imageUrl }: { imageUrl: string }) => (
  <Phone>
    <HighlightImg src={imageUrl} className="w-full aspect-[865/503]" />
    <div className="px-3 pt-3 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
          <div className="h-7 w-7 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <Bar className="w-2/3" />
            <Bar className="w-1/3 !h-1.5" />
          </div>
        </div>
      ))}
    </div>
    <BottomTabs />
  </Phone>
);

const FincasListMock = ({ imageUrl, highlightCardPhoto }: { imageUrl: string; highlightCardPhoto?: boolean }) => (
  <Phone>
    {highlightCardPhoto ? (
      <div className="w-full aspect-[865/503] bg-muted" />
    ) : (
      <HighlightImg src={imageUrl} className="w-full aspect-[865/503]" />
    )}
    <div className="px-3 pt-3 space-y-2">
      {Array.from({ length: 3 }).map((_, i) => {
        const isFirst = i === 0 && highlightCardPhoto;
        return (
          <div key={i} className="rounded-lg overflow-hidden bg-card border border-border">
            {isFirst ? (
              <HighlightImg src={imageUrl} className="w-full aspect-[16/10]" />
            ) : (
              <div className="w-full aspect-[16/10] bg-muted" />
            )}
            <div className="p-2 space-y-1">
              <Bar className="w-1/2" />
              <Bar className="w-1/3 !h-1.5" />
            </div>
          </div>
        );
      })}
    </div>
    <BottomTabs />
  </Phone>
);

const MenuFincaMock = ({ imageUrl }: { imageUrl: string }) => (
  <Phone>
    <HighlightImg src={imageUrl} className="w-full aspect-[865/503]" />
    <div className="px-3 pt-3 grid grid-cols-2 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-muted overflow-hidden flex items-end p-1">
          <div className="h-1.5 w-1/2 rounded bg-muted-foreground/30" />
        </div>
      ))}
    </div>
    <BottomTabs />
  </Phone>
);

const LoginMock = ({ imageUrl, target }: { imageUrl: string; target: "hero" | "logo" }) => (
  <Phone>
    {target === "hero" ? (
      <HighlightImg src={imageUrl} className="w-full aspect-[3/4]" />
    ) : (
      <div className="w-full aspect-[3/4] bg-muted" />
    )}
    <div className="px-5 pt-4 space-y-3">
      {target === "logo" && (
        <div className="mx-auto h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary animate-pulse">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="h-7 rounded-md bg-muted" />
      <div className="h-7 rounded-md bg-muted" />
      <div className="h-8 rounded-md bg-gold-solid" />
    </div>
  </Phone>
);

const MENU_ICON_INDEX: Record<string, number> = {
  [ASSET_KEYS.iconFincas]: 0,
  [ASSET_KEYS.iconMachos]: 1,
  [ASSET_KEYS.iconHembras]: 2,
  [ASSET_KEYS.iconCrias]: 3,
  [ASSET_KEYS.iconEmbriones]: 4,
  [ASSET_KEYS.iconOtros]: 5,
};

const CATEGORY_LABEL: Record<string, string> = {
  [ASSET_KEYS.bannerMachos]: "Visible en /categoria/macho · cabecera",
  [ASSET_KEYS.bannerHembras]: "Visible en /categoria/hembra · cabecera",
  [ASSET_KEYS.bannerCrias]: "Visible en /categoria/cria · cabecera",
  [ASSET_KEYS.bannerEmbriones]: "Visible en /categoria/embrion · cabecera",
  [ASSET_KEYS.bannerFincas]: "Visible en /fincas · cabecera de la lista",
};

const FINCA_FOTO_KEY = "finca.foto";

const AssetLocationPreview = ({ assetKey, imageUrl }: Props) => {
  if (assetKey === ASSET_KEYS.menuBanner) {
    return (
      <div>
        <MenuMock imageUrl={imageUrl} highlightBanner />
        <Caption>Banner principal de /menu, en la parte superior.</Caption>
      </div>
    );
  }

  if (MENU_ICON_INDEX[assetKey] !== undefined) {
    return (
      <div>
        <MenuMock imageUrl={imageUrl} highlightIconIndex={MENU_ICON_INDEX[assetKey]} />
        <Caption>Icono dentro del grid de /menu (resaltado).</Caption>
      </div>
    );
  }

  if (assetKey === ASSET_KEYS.logo) {
    return (
      <div>
        <LoginMock imageUrl={imageUrl} target="logo" />
        <Caption>Logo en pantallas de marca y cabeceras.</Caption>
      </div>
    );
  }

  if (assetKey === ASSET_KEYS.loginHero) {
    return (
      <div>
        <LoginMock imageUrl={imageUrl} target="hero" />
        <Caption>Imagen de fondo de la pantalla de login.</Caption>
      </div>
    );
  }

  if (assetKey === ASSET_KEYS.bannerMenuFinca) {
    return (
      <div>
        <MenuFincaMock imageUrl={imageUrl} />
        <Caption>Cabecera de /finca/:id/menu-finca cuando la finca no tiene foto propia.</Caption>
      </div>
    );
  }

  if (assetKey === ASSET_KEYS.bannerFincas) {
    return (
      <div>
        <FincasListMock imageUrl={imageUrl} />
        <Caption>{CATEGORY_LABEL[assetKey]}</Caption>
      </div>
    );
  }

  if (CATEGORY_LABEL[assetKey]) {
    return (
      <div>
        <CategoryListMock imageUrl={imageUrl} />
        <Caption>{CATEGORY_LABEL[assetKey]}</Caption>
      </div>
    );
  }

  if (assetKey === FINCA_FOTO_KEY || assetKey.startsWith("finca.")) {
    return (
      <div>
        <FincasListMock imageUrl={imageUrl} highlightCardPhoto />
        <Caption>Foto de la finca: aparece en la tarjeta de /fincas y como cabecera de /finca/:id/menu-finca.</Caption>
      </div>
    );
  }

  return (
    <div className="text-center text-sm text-muted-foreground py-8">
      Vista previa no disponible para este asset.
    </div>
  );
};

export default AssetLocationPreview;
