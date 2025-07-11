import { CombinerRestClient } from "aiwize-combiner-core";
import manifest from "../../manifest.json";
import { reportError } from "./errorReporter";

export type Theme = "light" | "dark";

// Path of the file that stores the current theme – one file, no duplicates
const THEME_FILE_PATH = "theme.txt";

// Shared REST client instance
const client = new CombinerRestClient({ moduleId: manifest.id });

/**
 * Reads the theme from the Combiner virtual filesystem.
 * Returns "light" | "dark" when present; otherwise null.
 */
export async function readThemeFromDB(): Promise<Theme | null> {
  try {
    const content = await client.readFile(THEME_FILE_PATH, "utf-8");
    if (!content) return null;

    // Combiner may wrap content; normalise to string
    let raw = "";
    if (typeof content === "string") {
      raw = content;
    } else if (typeof content === "object" && content !== null) {
      if ("content" in content) raw = String((content as any).content ?? "");
      else if ("data" in content) raw = String((content as any).data ?? "");
      else raw = String(content);
    }

    const trimmed = raw.trim();
    return trimmed === "light" || trimmed === "dark" ? (trimmed as Theme) : null;
  } catch (err: any) {
    const status = err?.status ?? err?.code ?? err?.response?.status;
    // 404 means file not found – treat as "no theme stored yet"
    if (status === 404) return null;
    reportError("Modules server is not available now");
    return null;
  }
}

/**
 * Persists the theme to the filesystem. Overwrites the file – no duplicates possible.
 */
export async function writeThemeToDB(theme: Theme): Promise<void> {
  try {
    await client.writeFile(THEME_FILE_PATH, theme, "utf-8");
  } catch (err) {
    reportError("Modules server is not available now");
  }
} 