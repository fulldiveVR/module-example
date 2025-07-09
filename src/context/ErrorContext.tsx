import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import ErrorModal from "../components/ErrorModal";
import { registerErrorSetter } from "../utils/errorReporter";

interface ErrorContextValue {
  setError: (msg: string | null) => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    registerErrorSetter(setMessage);
    return () => registerErrorSetter(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ setError: setMessage }}>
      {children}
      <ErrorModal message={message} onClose={() => setMessage(null)} />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used within an ErrorProvider");
  return ctx.setError;
} 