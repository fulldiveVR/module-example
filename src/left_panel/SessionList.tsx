import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { WIZE_TEAMS_BASE_URL } from "../utils/api";

interface AgentSession {
  id: string;
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

const STORAGE_CURRENT_KEY = "currentAgentSessionId";
const STORAGE_OPEN_KEY = "openAgentSession";

export default function SessionList({ width = "100%" }: SessionListProps) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_CURRENT_KEY);
  });

  // Load auth token once
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
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

  // Listen to storage events to keep currentId in sync (changes from Chat)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_CURRENT_KEY) {
        setCurrentId(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const openSession = (session: AgentSession) => {
    const payload = {
      sessionId: session.id,
      agentId: session.agentId,
      model: session.model,
      ts: Date.now(), // ensure distinct value so storage event fires
    };
    localStorage.setItem(STORAGE_OPEN_KEY, JSON.stringify(payload));
    localStorage.setItem(STORAGE_CURRENT_KEY, session.id);
    setCurrentId(session.id);
  };

  return (
    <div
      style={{
        width,
        height: "100%",
        overflowY: "auto",
        padding: 8,
        boxSizing: "border-box",
        backgroundColor: "var(--color-background)",
        color: "var(--text-primary)",
        borderRight: "1px solid var(--neutral-outline)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Sessions</h3>
      {sessions.map((s) => {
        const isActive = s.id === currentId;
        const trimmedName = s.meta?.name?.trim() || "";
        const label = s.id + " " + trimmedName;
        return (
          <div
            key={s.id}
            onClick={() => openSession(s)}
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: isActive ? "var(--primary-transparent-light)" : "transparent",
              fontWeight: isActive ? 600 : 400,
              fontSize: 12,
              marginBottom: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </div>
        );
      })}
      {sessions.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--neutral-gray)" }}>No sessions</div>
      )}
    </div>
  );
} 