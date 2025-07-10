import { CombinerRestClient } from "aiwize-combiner-core";
import manifest from "../../manifest.json";
import { reportError } from "./errorReporter";

// Path where the AIWIZE auth token is expected to be stored.
const AIWIZE_TOKEN_PATH = "aiwize-token.txt";

// Instantiate REST client using module id from manifest
const client = new CombinerRestClient({ moduleId: manifest.id });

/**
 * Reads the stored authentication token (if any).
 * Returns the raw token string or null when not found / not logged in.
 */
export async function getToken(): Promise<string | null> {
  try {
    const content = await client.readFile(AIWIZE_TOKEN_PATH, "utf-8");
    console.log("content", content);
    console.log("AIWIZE_TOKEN_PATH", AIWIZE_TOKEN_PATH);
    // When the file does not exist (often represented as null/undefined or 404), treat it as
    // "not logged in" rather than a fatal error. We only surface an error when the server is
    // completely unreachable. Returning null here is enough for callers to detect logged-out
    // state without showing the error modal.
    if (!content) {
      return null;
    }

    // Combiner API sometimes wraps the file content in an object – normalise it here
    let raw: string = "";
    if (typeof content === "string") {
      raw = content;
    } else if (typeof content === "object" && content !== null) {
      // Typical shape: { content: "..." } or { data: "..." }
      if ("content" in content) {
        raw = String((content as any).content ?? "");
      } else if ("data" in content) {
        raw = String((content as any).data ?? "");
      } else {
        raw = String(content);
      }
    }

    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  } catch (err: any) {
    // Distinguish between "file not found" (404) and true connectivity problems.
    const status = (err && (err.status || err.code || err?.response?.status)) ?? undefined;

    // 404 is a normal business situation: the token file hasn't been created yet.
    if (status === 404) {
      return null;
    }

    // Anything else likely means the modules server cannot be reached – show the modal.
    reportError("Modules server is not available now");
    return null;
  }
}

/**
 * Removes the stored authentication token (if any) effectively logging the user out.
 */
export async function deleteToken(): Promise<void> {
  try {
    // CombinerRestClient currently does not expose a filesystem delete operation.
    // Overwrite the token file with an empty string so that subsequent reads
    // return null (treated as logged-out).
    await client.writeFile(AIWIZE_TOKEN_PATH, "", "utf-8");
  } catch (err) {
    console.error("Error wiping token:", err);
    // Silently ignore errors – e.g., file not found or network issues
  }
}

/**
 * Logs the current user out by deleting the token file and optionally performing additional cleanup.
 */
export async function logout(): Promise<void> {
  await deleteToken();
} 