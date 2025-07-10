import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";

/**
 * React hook that resolves to `true` when a valid auth token exists, `false` otherwise.
 * Returns `undefined` while the token lookup is in progress.
 */
export function useLoggedIn(): boolean | undefined {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const token = await getToken();
      console.log("token", token);
      if (!isMounted) return;
      setLoggedIn(token !== null);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return loggedIn;
} 