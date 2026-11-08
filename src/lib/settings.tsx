import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePref = "system" | "light" | "dark";

export type Settings = {
  theme: ThemePref;
  imageQuality: number; // 40–100
  jpgBackground: string;
  filenameSuffix: string;
  reduceMotion: boolean;
  rememberRecent: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  imageQuality: 85,
  jpgBackground: "#ffffff",
  filenameSuffix: "",
  reduceMotion: false,
  rememberRecent: true,
};

export const SETTINGS_KEY = "forma:settings";
const RECENT_KEY = "forma:recent";

/** Runs before hydration to set the theme class without a flash. */
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");var t=s.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var c=document.documentElement.classList;if(d)c.add("dark");if(s.reduceMotion)c.add("reduce-motion")}catch(e){}})();`;

type Ctx = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
  resolvedTheme: "light" | "dark";
  recent: string[];
  pushRecent: (toolId: string) => void;
  clearRecent: () => void;
  hydrated: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

function applyTheme(dark: boolean, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  }
  root.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0c0d0e" : "#f9fafb");
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recent, setRecent] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecent(JSON.parse(r));
    } catch {
      /* corrupted storage — fall back to defaults */
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    setHydrated(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" =
    settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(resolvedTheme === "dark", true);
  }, [resolvedTheme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("reduce-motion", settings.reduceMotion);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const pushRecent = useCallback(
    (id: string) => {
      if (!settings.rememberRecent) return;
      setRecent((list) => {
        const next = [id, ...list.filter((x) => x !== id)].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    },
    [settings.rememberRecent],
  );

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }, []);

  const value = useMemo(
    () => ({ settings, update, reset, resolvedTheme, recent, pushRecent, clearRecent, hydrated }),
    [settings, update, reset, resolvedTheme, recent, pushRecent, clearRecent, hydrated],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
