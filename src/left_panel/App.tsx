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
        padding: "12px 16px",
        display: "flex",
        justifyContent: "flex-end",
        borderBottom: "1px solid var(--neutral-outline)",
      }}>
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
            style={{ width: 24, height: 24 }}
          />
        </button>
      </div>

      {/* Sessions list */}
      <div style={{ height: "50vh", overflow: "hidden" }}>
        <SessionList />
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
