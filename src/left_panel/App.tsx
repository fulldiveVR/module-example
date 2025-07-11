import React, { useState } from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";
import LightIcon from "@/assets/theme_light.svg";
import DarkIcon from "@/assets/theme_dark.svg";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../utils/auth";
import { ErrorProvider } from "../context/ErrorContext";
import SessionList from "./SessionList";
import DocumentList from "./DocumentList";

function PanelApp() {
  const loggedIn = useLoggedIn();
  const { theme, toggleTheme } = useTheme("left");
  const { user, loading } = useCurrentUser();
  const [hoverLogout, setHoverLogout] = useState(false);
  ensureThemeStyles();

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
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
      {/* Header with theme toggle */}
      <div style={{
        height: 60,
        padding: "0 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--neutral-outline)",
        background: "linear-gradient(90deg, var(--tile-bg) 0%, var(--neutral-light-gray-hover) 100%)",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
        backdropFilter: "blur(6px)",
      }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>AI Wize</h2>
        <button
          onClick={toggleTheme}
          style={{
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <img
            src={theme === "light" ? DarkIcon : LightIcon}
            alt="Toggle theme"
            style={{ width: 20, height: 20 }}
          />
        </button>
      </div>

      {/* Sessions & Documents lists */}
      <div
        style={{
          flex: 1,
          overflow: "hidden", // no scroll on wrapper
          display: "flex",
          flexDirection: "column",
          paddingBottom: 50, // space for user email
          boxSizing: "border-box",
        }}
      >
        <SessionList />
        <DocumentList />
      </div>

      {/* Bottom-left user email & logout */}
      {loggedIn && !loading && user?.provider?.email?.id && (
        <>
          <button
            title="Logout"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {user.provider.email.id}
          </button>
          {hoverLogout && (
            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: 10,
                padding: "4px 8px",
                backgroundColor: "var(--color-background)",
                color: "var(--text-primary)",
                border: "1px solid var(--text-primary)",
                borderRadius: 4,
                fontSize: 12,
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              Logout
            </div>
          )}
        </>
      )}
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
