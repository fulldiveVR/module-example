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

  // Collapsible list state – expanded by default for better UX
  const [expanded, setExpanded] = useState(true);

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
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--neutral-outline)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        transition: "all var(--transition-base)",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          padding: "var(--spacing-md) var(--spacing-lg)",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor: expanded ? "var(--neutral-light-gray-hover)" : "transparent",
          borderBottom: expanded ? "1px solid var(--neutral-outline)" : "none",
          transition: "all var(--transition-fast)",
          userSelect: "none",
        }}
      >
        <div style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "var(--spacing-sm)",
          color: "var(--text-secondary)",
          fontSize: "var(--font-size-sm)",
          transition: "transform var(--transition-fast)",
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        }}>
          ▶
        </div>
        <h3 style={{
          margin: 0,
          fontSize: "var(--font-size-md)",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.025em",
        }}>
          Sessions
        </h3>
        <div style={{
          marginLeft: "auto",
          fontSize: "var(--font-size-xs)",
          color: "var(--text-tertiary)",
          fontWeight: 500,
          backgroundColor: "var(--neutral-light-gray-hover)",
          padding: "var(--spacing-xs) var(--spacing-sm)",
          borderRadius: "var(--radius-full)",
        }}>
          {sessions.length}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--spacing-xs)",
            maxHeight: "300px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {sessions.map((s) => {
              const isActive = s.id === currentId;
              const trimmedName = s.meta?.name?.trim() || "";
              const displayName = trimmedName || `Session ${s.id.slice(-8)}`;
              
              return (
                <div
                  key={s.id}
                  onClick={() => openSession(s)}
                  className={`list-item ${isActive ? 'active' : ''}`}
                  style={{
                    padding: "var(--spacing-sm)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    backgroundColor: isActive ? "var(--primary-transparent)" : "transparent",
                    border: isActive ? "1px solid var(--primary)" : "1px solid transparent",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-sm)",
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "var(--radius-full)",
                      backgroundColor: isActive ? "var(--primary)" : "var(--neutral-gray)",
                      transition: "all var(--transition-fast)",
                      flexShrink: 0,
                    }} />
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--spacing-xs)",
                      flex: 1,
                      minWidth: 0,
                    }}>
                      <div style={{
                        fontSize: "var(--font-size-sm)",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "var(--primary)" : "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {displayName}
                      </div>
                      {s.model && (
                        <div style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--text-tertiary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--spacing-xs)",
                        }}>
                          <span>{s.model.id}</span>
                          <span>•</span>
                          <span>T: {s.model.temperature}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {sessions.length === 0 && (
            <div style={{
              padding: "var(--spacing-2xl)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--font-size-sm)",
            }}>
              <div style={{
                fontSize: "var(--font-size-3xl)",
                marginBottom: "var(--spacing-md)",
                opacity: 0.3,
              }}>
                💬
              </div>
              <div style={{ fontWeight: 500, marginBottom: "var(--spacing-xs)" }}>
                No sessions yet
              </div>
              <div style={{ fontSize: "var(--font-size-xs)" }}>
                Start a new conversation to see sessions here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 