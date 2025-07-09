import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { WIZE_TEAMS_BASE_URL } from "../utils/api";

interface ProviderEmail {
  id: string;
}

interface Provider {
  email?: ProviderEmail;
  [key: string]: unknown;
}

export interface User {
  id: string;
  userName: string;
  provider?: Provider;
  [key: string]: unknown;
}

interface UseCurrentUserResult {
  user: User | null;
  loading: boolean;
  error: unknown;
}

/**
 * Hook that fetches the current authenticated user from the backend.
 * Returns `null` when no token is available (not logged in).
 */
export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          // Not logged in
          if (!cancelled) setLoading(false);
          return;
        }

        const resp = await fetch(`${WIZE_TEAMS_BASE_URL}/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!resp.ok) {
          throw new Error(`Failed to fetch user: ${resp.status} ${resp.statusText}`);
        }

        const data: User = await resp.json();
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
} 