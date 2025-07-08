import React from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";
import LightIcon from "@/assets/theme_light.svg";
import DarkIcon from "@/assets/theme_dark.svg";

function App() {
  const loggedIn = useLoggedIn();
  const { theme, toggleTheme } = useTheme("left");
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
          padding: 0,
          backgroundColor: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <img
          src={theme === "light" ? DarkIcon : LightIcon}
          alt="Toggle theme"
          style={{ width: 24, height: 24 }}
        />
      </button>
      Hello World (Left Panel)
    </div>
  );
}

export default App;
