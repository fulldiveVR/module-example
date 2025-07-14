import React from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";
import { ErrorProvider } from "../context/ErrorContext";
import Chat from "./Chat";

function PanelApp() {
  const loggedIn = useLoggedIn();
  useTheme("right");
  ensureThemeStyles();

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--color-background)",
    fontFamily: "var(--font-family-primary)",
    fontSize: "var(--font-size-md)",
    color: "var(--text-primary)",
  };

  if (loggedIn === false) {
    return (
      <div style={containerStyle}>
        <div style={{
          textAlign: "center",
          padding: "var(--spacing-3xl)",
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--neutral-outline)",
          boxShadow: "var(--shadow-sm)",
          maxWidth: "400px",
        }}>
          <div style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: 600,
            marginBottom: "var(--spacing-md)",
            color: "var(--text-primary)",
          }}>
            Welcome to AI Wize
          </div>
          <div style={{
            fontSize: "var(--font-size-md)",
            color: "var(--text-secondary)",
            marginBottom: "var(--spacing-lg)",
          }}>
            Please login to start chatting with AI
          </div>
          <div style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--text-tertiary)",
            padding: "var(--spacing-md)",
            backgroundColor: "var(--neutral-light-gray-hover)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--neutral-outline)",
          }}>
            💡 Tip: Use the left panel to manage your sessions and documents
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "var(--color-background)",
      fontFamily: "var(--font-family-primary)",
      fontSize: "var(--font-size-md)",
      color: "var(--text-primary)",
    }}>
      <Chat />
    </div>
  );
}

export default function App() {
  return (
    <ErrorProvider>
      <PanelApp />
    </ErrorProvider>
  );
}
