/**
 * Claves canónicas de los assets editables desde el panel Superadmin.
 * Mantener sincronizado con `useAppAsset` y `Imagenes.tsx`.
 */
import jpsLogo from "@/assets/jps-logo.webp";
import menuHeader from "@/assets/menu-header.webp";
import iconFincas from "@/assets/menu-icons/fincas.webp";
import iconMachos from "@/assets/menu-icons/machos.webp";
import iconHembras from "@/assets/menu-icons/hembras.webp";
import iconCrias from "@/assets/menu-icons/crias.webp";
import iconEmbriones from "@/assets/menu-icons/embriones.webp";
import iconGeneralidades from "@/assets/menu-icons/generalidades.webp";
import jpsLoginHero from "@/assets/jps-login-hero.png";
import listaHeader from "@/assets/lista-header.jpg";
import bannerHembras from "@/assets/banner-hembras.webp";

export const ASSET_KEYS = {
  logo: "global.logo",
  loginHero: "global.login_hero",
  menuBanner: "menu.banner",
  iconFincas: "menu.icon.fincas",
  iconMachos: "menu.icon.machos",
  iconHembras: "menu.icon.hembras",
  iconCrias: "menu.icon.crias",
  iconEmbriones: "menu.icon.embriones",
  iconOtros: "menu.icon.otros",
  bannerMachos: "categoria.banner.machos",
  bannerHembras: "categoria.banner.hembras",
  bannerCrias: "categoria.banner.crias",
  bannerEmbriones: "categoria.banner.embriones",
  bannerFincas: "categoria.banner.fincas",
} as const;

export const ASSET_FALLBACKS: Record<string, string> = {
  [ASSET_KEYS.logo]: jpsLogo,
  [ASSET_KEYS.loginHero]: jpsLoginHero,
  [ASSET_KEYS.menuBanner]: menuHeader,
  [ASSET_KEYS.iconFincas]: iconFincas,
  [ASSET_KEYS.iconMachos]: iconMachos,
  [ASSET_KEYS.iconHembras]: iconHembras,
  [ASSET_KEYS.iconCrias]: iconCrias,
  [ASSET_KEYS.iconEmbriones]: iconEmbriones,
  [ASSET_KEYS.iconOtros]: iconGeneralidades,
  [ASSET_KEYS.bannerMachos]: listaHeader,
  [ASSET_KEYS.bannerHembras]: bannerHembras,
  [ASSET_KEYS.bannerCrias]: listaHeader,
  [ASSET_KEYS.bannerEmbriones]: listaHeader,
};

export const fincaAssetKey = (fincaId: string) => `finca.${fincaId}.foto`;
