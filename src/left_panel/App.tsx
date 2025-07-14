import React, { useState } from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";
import { ensureThemeStyles } from "../theme";
import { useTheme } from "../hooks/useTheme";
import LightIcon from "@/assets/theme_light.svg";
import DarkIcon from "@/assets/theme_dark.svg";
import LogoIcon from "@/assets/ic_logo_wize.svg";
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
    fontFamily: "var(--font-family-primary)",
    fontSize: "var(--font-size-md)",
    color: "var(--text-primary)",
  };

  if (loggedIn === false) {
    return (
      <div style={{
        ...containerStyle,
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
      }}>
        <div style={{
          textAlign: "center",
          padding: "var(--spacing-3xl)",
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--neutral-outline)",
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: 600,
            marginBottom: "var(--spacing-md)",
            color: "var(--text-primary)",
          }}>
            Welcome to AI Wize
          </div>
          <div style={{ fontSize: "var(--font-size-md)" }}>
            Please login to continue
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, position: "relative" }}>
      {/* Header with improved design */}
      <div style={{
        height: 64,
        padding: "0 var(--spacing-xl)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--neutral-outline)",
        boxShadow: "var(--shadow-sm)",
        backdropFilter: "blur(10px)",
        position: "relative",
        zIndex: 10,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
        }}>
          <img
            src={LogoIcon}
            alt="AI Wize"
            style={{
              height: 32,
              width: "auto",
            }}
          />
        </div>
        <button
          onClick={toggleTheme}
          style={{
            padding: "var(--spacing-sm)",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color var(--transition-fast)",
          }}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <img
            src={theme === "light" ? DarkIcon : LightIcon}
            alt="Toggle theme"
            style={{ width: 20, height: 20 }}
          />
        </button>
      </div>

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingBottom: 60, // space for user info
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md)",
          boxSizing: "border-box",
        }}
      >
        <SessionList />
        <DocumentList />
      </div>

      {/* Bottom user info with modern design */}
      {loggedIn && !loading && user?.provider?.email?.id && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "var(--spacing-md) var(--spacing-xl)",
          backgroundColor: "var(--color-surface)",
          borderTop: "1px solid var(--neutral-outline)",
          backdropFilter: "blur(10px)",
        }}>
          <button
            title="Click to logout"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              backgroundColor: "transparent",
              border: "none",
              padding: "var(--spacing-sm) var(--spacing-md)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              borderRadius: "var(--radius-md)",
              transition: "all var(--transition-fast)",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: "var(--radius-full)",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              flexShrink: 0,
            }}>
              {user.provider.email.id.charAt(0).toUpperCase()}
            </div>
            <div style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
            }}>
              {user.provider.email.id}
            </div>
          </button>
          {hoverLogout && (
            <div
              style={{
                position: "absolute",
                bottom: 65,
                left: "var(--spacing-xl)",
                padding: "var(--spacing-sm) var(--spacing-md)",
                backgroundColor: "var(--color-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--neutral-outline)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
                pointerEvents: "none",
                whiteSpace: "nowrap",
                boxShadow: "var(--shadow-lg)",
                zIndex: 20,
              }}
            >
              Click to logout
            </div>
          )}
        </div>
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
