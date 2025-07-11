import { useCallback, useEffect, useRef, useState } from "react";
import { CombinerWebSocketClient } from "aiwize-combiner-core";
import { reportError } from "../utils/errorReporter";
import { readThemeFromDB, writeThemeToDB } from "../utils/themeStorage";

export type Theme = "light" | "dark";

const THEME_KEY = "aiwize-theme";
export const MODULE_ID = "www"; // keep in sync with manifest.json

export function useTheme(panelName: string) {

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(THEME_KEY);
    const initial = stored === "dark" ? "dark" : "light";
    // Apply immediately to avoid flash
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initial);
    }
    return initial;
  });

  const [dbReady, setDbReady] = useState(false);

  // --- WebSocket setup for cross-panel syncing ---------------------------------
  const wsRef = useRef<CombinerWebSocketClient | null>(null);

  useEffect(() => {
    // Guard: library may not be available server-side
    if (typeof window === "undefined") return;

    const client = new CombinerWebSocketClient({
      moduleId: MODULE_ID,
      panel: panelName,
    });
    wsRef.current = client;

    // helper to apply incoming theme object
    const handleIncoming = (obj: any) => {
      if (obj?.type === "theme-change" && (obj.theme === "light" || obj.theme === "dark")) {
        setTheme((prev) => (prev !== obj.theme ? obj.theme : prev));
      }
    };

    client.on("json", (data: any) => {
      handleIncoming(data);
    });

    client.on("message", (raw: any) => {
      // raw may be Blob, ArrayBuffer, or string
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          handleIncoming(parsed);
        } catch {}
      } else if (raw instanceof Blob) {
        raw.text().then((text) => {
          try {
            const parsed = JSON.parse(text);
            handleIncoming(parsed);
          } catch {}
        });
      } else if (raw instanceof ArrayBuffer) {
        try {
          const text = new TextDecoder().decode(raw);
          const parsed = JSON.parse(text);
          handleIncoming(parsed);
        } catch {}
      }
    });

    client.on("open", () => {
      // share current theme with any existing peers
      try {
        client.send({ type: "theme-change", theme });
      } catch (_) {}
    });

    client.on("close", () => {
      reportError("Modules server is not available now");
    });

    client.on("error", () => {
      reportError("Modules server is not available now");
    });

    client.connect().catch(() => {
      reportError("Modules server is not available now");
    });

    return () => {
      try {
        client.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [panelName]);

  // After initial mount – load persisted theme from DB -----------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readThemeFromDB();
      if (!cancelled && stored) {
        if (stored !== theme) {
          setTheme(stored);
        }
      }
      if (!cancelled) setDbReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------------

  // Apply theme to document element and persist
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    // Notify the other panel via websocket (ignore readyState – client buffers until open)
    const client = wsRef.current;
    if (client) {
      try {
        client.send({ type: "theme-change", theme });
      } catch (e) {
        /* ignore */
      }
    }
  }, [theme]);

  // Listen for theme changes in other tabs/panels
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue as Theme);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      // Persist to DB only when remote has been read (avoid duplicate writes on init)
      if (dbReady) {
        writeThemeToDB(next).catch(() => {/* error surfaced inside util */});
      }
      const client = wsRef.current;
      if (client) {
        try {
          client.send({ type: "theme-change", theme: next });
        } catch (_) {}
      }
      return next;
    });
  }, [dbReady]);

  return {
    theme,
    toggleTheme,
  } as const;
} 