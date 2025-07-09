import React from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";
import { ErrorProvider } from "../context/ErrorContext";

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
    fontFamily: "Arial, sans-serif",
    fontSize: "18px",
    color: "var(--text-primary)",
  };

  if (loggedIn === false) {
    return <div style={containerStyle}>Please login</div>;
  }

  return (
    <div style={{ ...containerStyle, position: "relative" }}>
      {/* Content of right panel */}
      Hello World (Right Panel)

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
