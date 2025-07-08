import React from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";

function App() {
  const loggedIn = useLoggedIn();
  const { theme, toggleTheme } = useTheme();
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
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "6px 10px",
          backgroundColor: "var(--primary)",
          color: "var(--neutral-light)",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {theme === "light" ? "Dark" : "Light"} Mode
      </button>
      Hello World (Right Panel)
    </div>
  );
}

export default App;
