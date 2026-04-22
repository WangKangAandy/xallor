import { lazy } from "react";
import { useAppI18n } from "../i18n/AppI18n";
import { GlassSurface } from "../components/shared/GlassSurface";

export const SearchBarLazy = lazy(async () => {
  const m = await import("../components/SearchBar");
  return { default: m.SearchBar };
});

export const MultiDesktopStripLazy = lazy(async () => {
  const m = await import("../components/MultiDesktopStrip");
  return { default: m.MultiDesktopStrip };
});

export const SidebarLazy = lazy(async () => {
  const m = await import("../components/Sidebar");
  return { default: m.Sidebar };
});

export function MultiDesktopFallback() {
  const { t } = useAppI18n();
  return (
    <GlassSurface
      variant="fallbackPanel"
      rounded="3xl"
      className="w-full min-h-[320px] max-w-[1200px] xl:max-w-[1280px] mx-auto flex items-center justify-center text-white/70 text-sm"
      aria-hidden
    >
      {t("app.loadingDesktop")}
    </GlassSurface>
  );
}

export function SidebarFallback() {
  return <div className="fixed left-0 top-0 h-full w-4 z-30" aria-hidden />;
}

export function SearchBarFallback() {
  return (
    <GlassSurface
      variant="fallbackBar"
      rounded="full"
      className="w-full max-w-[640px] xl:max-w-[680px] 2xl:max-w-[720px] h-14 animate-pulse"
      aria-hidden
    />
  );
}
