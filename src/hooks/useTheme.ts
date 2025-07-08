import { useCallback, useEffect, useRef, useState } from "react";
import { CombinerWebSocketClient } from "aiwize-combiner-core";

export type Theme = "light" | "dark";

const THEME_KEY = "aiwize-theme";
const MODULE_ID = "module-example-aiwize-simple"; // keep in sync with manifest.json

export function useTheme(panelName: string) {

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_KEY);
    const initial = stored === "dark" ? "dark" : "light";
    // Apply immediately to avoid flash
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initial);
    }
    return initial;
  });

  // --- WebSocket setup for cross-panel syncing ---------------------------------
  const wsRef = useRef<CombinerWebSocketClient | null>(null);

  useEffect(() => {
    // Guard: library may not be available server-side
    if (typeof window === "undefined") return;

    const client = new CombinerWebSocketClient({
      moduleId: MODULE_ID,
      panel: panelName,
    });
    // console.log(`[WS ${panelName}] initializing websocket client`);
    wsRef.current = client;

    // helper to apply incoming theme object
    const handleIncoming = (obj: any) => {
      if (obj?.type === "theme-change" && (obj.theme === "light" || obj.theme === "dark")) {
        setTheme((prev) => (prev !== obj.theme ? obj.theme : prev));
      }
    };

    client.on("json", (data: any) => {
      // console.log(`[WS ${panelName}] received json`, data);
      handleIncoming(data);
    });

    client.on("message", (raw: any) => {
      // console.log(`[WS ${panelName}] raw message`, raw);
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
        // console.log(`[WS ${panelName}] sending initial theme`, theme);
        client.send({ type: "theme-change", theme });
      } catch (_) {}
    });

    client.on("close", () => {});

    client.on("error", () => {});

    client.connect().catch(() => {});

    return () => {
      try {
        client.disconnect();
      } catch (e) {
        /* ignore */
      }
    };
  }, [panelName]);

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
        // console.log(`[WS ${panelName}] send theme-change`, theme);
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
      const client = wsRef.current;
      if (client) {
        try {
          // console.log(`[WS ${panelName}] send theme-change`, next);
          client.send({ type: "theme-change", theme: next });
        } catch (_) {}
      }
      return next;
    });
  }, []);

  return {
    theme,
    toggleTheme,
  } as const;
} 