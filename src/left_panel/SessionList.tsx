import React, { useEffect, useRef, useState } from "react";
import { getToken } from "../utils/auth";
import { WIZE_TEAMS_BASE_URL } from "../utils/api";
import { CombinerWebSocketClient } from "aiwize-combiner-core";
import { MODULE_ID } from "@/hooks/useTheme";

interface AgentSession {
  id: string;
  sessionId?: string;
  agentId?: string;
  meta?: {
    name?: string;
  };
  updated?: string;
  created?: string;
  model?: {
    id: string;
    temperature: number;
  };
}

interface SessionListProps {
  width?: number | string;
}

// WebSocket event types
const EVT_OPEN_SESSION = "OPEN_SESSION";
const EVT_SESSION_ACTIVE = "SESSION_ACTIVE";

export default function SessionList({ width = "100%" }: SessionListProps) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Collapsible list state – closed by default
  const [expanded, setExpanded] = useState(false);

  // WebSocket ref (persist across renders)
  const wsRef = useRef<CombinerWebSocketClient | null>(null);

  // Load auth token once
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, []);

  // Establish WS connection when component mounts
  useEffect(() => {
    const ws = new CombinerWebSocketClient({ moduleId: MODULE_ID, panel: "left" });
    wsRef.current = ws;

    const handleJson = (msg: any) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === EVT_SESSION_ACTIVE && msg.payload) {
        const sid = (msg.payload.id as string) || (msg.payload.sessionId as string);
        if (sid) setCurrentId(sid);
      }
    };

    // Fallback for binary frames containing JSON text
    const handleRaw = (raw: any) => {
      if (raw instanceof Blob) {
        raw.text().then((txt: string) => {
          try {
            const parsed = JSON.parse(txt);
            handleJson(parsed);
          } catch {}
        });
      }
    };

    ws.on("json", handleJson);
    ws.on("message", handleRaw);

    ws.connect().catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error("[SessionList] WS connect error", err);
    });

    return () => {
      ws.disconnect();
    };
  }, []);

  // Fetch sessions when token ready
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const resp = await fetch(`${WIZE_TEAMS_BASE_URL}/ai-agents/sessions?limit=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!resp.ok) {
          // eslint-disable-next-line no-console
          console.error("Failed to load sessions", resp.status);
          return;
        }
        let data: AgentSession[] = await resp.json();

        setSessions(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching sessions", err);
      }
    })();
  }, [token]);

  // No longer using localStorage; currentId is updated via WS EVT_SESSION_ACTIVE.

  const openSession = (session: AgentSession) => {
    // eslint-disable-next-line no-console
    const payload = {
      id: session.id,
      sessionId: session.sessionId ?? session.id,
      agentId: session.agentId,
      model: session.model,
    };

    if (wsRef.current) {
      // eslint-disable-next-line no-console
      wsRef.current.send({ type: EVT_OPEN_SESSION, payload });
    } else {
      // eslint-disable-next-line no-console
      console.warn("[SessionList] WS not connected – cannot send OPEN_SESSION event");
    }

    setCurrentId(session.id);
  };

  return (
    <div
      style={{
        width,
        flex: expanded ? 1 : undefined,
        overflowY: expanded ? "auto" : "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: 8,
        boxSizing: "border-box",
        backgroundColor: "var(--color-background)",
        color: "var(--text-primary)",
        borderRight: "1px solid var(--neutral-outline)",
      }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          marginBottom: 4,
          position: "sticky",
          top: 0,
          backgroundColor: "var(--color-background)",
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: 12, marginRight: 4 }}>
          {expanded ? "▼" : "▶"}
        </span>
        <h3 style={{ margin: 0, fontSize: 14 }}>Sessions</h3>
      </div>
      {expanded && (
        <>
          {sessions.map((s) => {
            const isActive = s.id === currentId;
            const trimmedName = s.meta?.name?.trim() || "";
            const label = s.id + " " + trimmedName;
            return (
              <div
                key={s.id}
                onClick={() => openSession(s)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  backgroundColor: isActive ? "var(--primary-transparent-light)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13,
                  marginBottom: 4,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.4,
                }}
              >
                {label}
              </div>
            );
          })}
          {sessions.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--neutral-gray)" }}>
              No sessions
            </div>
          )}
        </>
      )}
    </div>
  );
} 