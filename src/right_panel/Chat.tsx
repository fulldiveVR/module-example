import React, { useEffect, useRef, useState } from "react";
import PlusIcon from "../components/PlusIcon";
import { CombinerRestClient } from "aiwize-combiner-core";
import SendIcon from "../components/SendIcon";
import { getToken } from "../utils/auth";
import { WIZE_TEAMS_BASE_URL } from "../utils/api";
import { reportError } from "../utils/errorReporter";

interface Model {
  id: string;
  icon?: string;
}

interface AgentMeta {
  name?: string;
  description?: string;
  icon?: string;
}

interface Agent {
  id: string;
  meta?: AgentMeta;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
}

// Lightweight SSE parser based on fetch + ReadableStream
async function streamSSE(
  url: string,
  body: any,
  headers: Record<string, string>,
  onEvent: (evt: any) => void,
): Promise<void> {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    throw new Error(`SSE request failed: ${resp.status} ${resp.statusText}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!rawEvent) continue;
      // strip possible "data:" prefix
      const line = rawEvent.startsWith("data:") ? rawEvent.slice(5).trim() : rawEvent;
      try {
        const obj = JSON.parse(line);
        onEvent(obj);
      } catch {
        // ignore non-json payloads
      }
    }
  }
}

// Add storage keys
const STORAGE_CURRENT_KEY = "currentAgentSessionId";
const STORAGE_OPEN_KEY = "openAgentSession";

export default function Chat() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Combiner REST client (persisted via ref to avoid re-instantiation)
  const combinerRef = useRef<CombinerRestClient | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  // Indicates that initial chat_state has been fetched (or attempted)
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  // Add debug logging for session id changes
  useEffect(() => {
    if (sessionId) {
      // eslint-disable-next-line no-console
      console.log("[Chat] Current agent session id:", sessionId);
    } else {
      // eslint-disable-next-line no-console
      console.log("[Chat] No agent session id");
    }
  }, [sessionId]);
  const [textareaHeight, setTextareaHeight] = useState<number>(70);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // No focus management needed – autoFocus on textarea handles initial focus.

  // Load auth token
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, []);

  // Sync current session id to localStorage for left panel highlight
  useEffect(() => {
    if (sessionId) {
      try {
        localStorage.setItem(STORAGE_CURRENT_KEY, sessionId);
      } catch {}
    }
  }, [sessionId]);

  // Handle external request to open specific session (sent via localStorage event)
  useEffect(() => {
    const fetchHistory = async (sid: string, agentId?: string) => {
      if (!token) return;
      try {
        const resp = await fetch(`${WIZE_TEAMS_BASE_URL}/ai-agents/sessions/${sid}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (resp.ok) {
          const data: any[] = await resp.json();
          const parsed = data.map((m: any) => {
            let content = "";
            if (typeof m.message === "string") {
              try {
                const parsedMsg = JSON.parse(m.message);
                if (typeof parsedMsg === "string") {
                  content = parsedMsg;
                } else if (parsedMsg && typeof parsedMsg.content === "string") {
                  content = parsedMsg.content;
                } else {
                  content = m.message;
                }
              } catch {
                content = m.message;
              }
            } else if (typeof m.content === "string") {
              content = m.content;
            } else if (m.content && typeof m.content.content === "string") {
              content = m.content.content;
            }
            return {
              id: m.id || `${m.sender}-${Date.now()}`,
              sender: m.sender === "assistant" ? "assistant" : "user",
              content,
            } as Message;
          });
          setMessages(parsed);
        } else {
          // eslint-disable-next-line no-console
          console.warn("Unable to fetch session messages", resp.status);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching history", err);
      }
    };

    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_OPEN_KEY || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue);
        if (!payload || !payload.sessionId) return;

        // Apply agent or model config depending on what we have
        if (payload.agentId) {
          setSelectedAgent(payload.agentId);
          setSelectedModel("");
        } else if (payload.model && payload.model.id) {
          setSelectedModel(payload.model.id);
          setSelectedAgent("");
          if (typeof payload.model.temperature === "number") {
            setTemperature(payload.model.temperature);
          }
        }

        setSessionId(payload.sessionId);
        // Reset current messages before loading history
        setMessages([]);
        fetchHistory(payload.sessionId, payload.agentId);
      } catch {}
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Fetch models & agents once token available
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        // fetch models
        const mResp = await fetch(`${WIZE_TEAMS_BASE_URL}/models`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!mResp.ok) throw new Error(`Models fetch failed: ${mResp.status}`);
        const mData: Model[] = await mResp.json();
        setModels(mData);

        // fetch agents
        const aResp = await fetch(`${WIZE_TEAMS_BASE_URL}/ai-agents`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!aResp.ok) throw new Error(`Agents fetch failed: ${aResp.status}`);
        const aData: Agent[] = await aResp.json();
        setAgents(aData);
      } catch (err: any) {
        reportError(err.message || String(err));
      }
    })();
  }, [token]);

  // Initialize Combiner REST client & load persisted chat state (once)
  useEffect(() => {
    combinerRef.current = new CombinerRestClient({ moduleId: "module-example-aiwize-chat" });
    (async () => {
      try {
        // fetch existing documents – pick the most recently updated (last)
        const docs: any[] = await combinerRef.current!.dbList("chat_state");
        if (docs && docs.length) {
          const last = docs[docs.length - 1];
          setDocId(last.id || last._id || null);
          setSessionId(last.sessionId ?? null);
          setMessages(last.messages ?? []);
          setSelectedAgent(last.selectedAgent ?? "");
          setSelectedModel(last.selectedModel ?? "");
          if (typeof last.temperature === "number") {
            setTemperature(last.temperature);
          }
        }
      } catch (err: any) {
        // ignore errors – will create doc on first persist
      } finally {
        // mark combiner data as loaded so we can safely persist changes
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist sessionId & messages to Combiner DB whenever they change
  useEffect(() => {
    // Skip persist until we know whether there is an existing chat_state doc.
    if (!combinerRef.current || !isLoaded) return;
    (async () => {
      try {
        const payload = { sessionId, messages, selectedAgent, selectedModel, temperature };
        if (docId) {
          await combinerRef.current!.dbUpdate("chat_state", docId, payload);
        } else {
          // Only create a new doc if there's meaningful data.
          if (
            sessionId !== null ||
            messages.length > 0 ||
            selectedAgent ||
            selectedModel
          ) {
            const created: any = await combinerRef.current!.dbCreate("chat_state", payload);
            setDocId(created.id || created._id || null);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [sessionId, messages, selectedAgent, selectedModel, temperature, isLoaded]);

  // Clears only conversation (keeps current model/agent settings)
  const resetSession = () => {
    setSessionId(null);
    setMessages([] as Message[]);
    // Combiner persistence hook will overwrite stored state accordingly
  };

  // Fully starts a brand-new session: clears settings + conversation
  const startNewSession = () => {
    setSelectedAgent("");
    setSelectedModel("");
    setTemperature(0.7);
    resetSession();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!token) {
      reportError("Not authenticated");
      return;
    }

    if (!selectedAgent && !selectedModel) {
      reportError("Please select an agent or a model first");
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      content: input,
    };
    setMessages((prev: Message[]) => [...prev, userMsg]);
    setInput("");

    const assistantId = `a-${Date.now()}`;
    setMessages((prev: Message[]) => [...prev, { id: assistantId, sender: "assistant", content: "" }]);

    const headers = { Authorization: `Bearer ${token}` };

    const onEvent = (obj: any): void => {
      // 1) streaming delta
      if (obj.messageDelta !== undefined) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + String(obj.messageDelta) } : m,
          ),
        );
        return;
      }

      // 2) finalized assistant message (complex structure per API docs)
      if (obj.message) {
        const msgObj = obj.message;
        let text = "";

        if (typeof msgObj.message === "string") {
          // may be JSON string or plain text
          try {
            const parsed = JSON.parse(msgObj.message);
            if (typeof parsed === "string") {
              text = parsed;
            } else if (parsed && typeof parsed.content === "string") {
              text = parsed.content;
            } else {
              text = msgObj.message;
            }
          } catch {
            text = msgObj.message;
          }
        } else if (typeof msgObj.content === "string") {
          text = msgObj.content;
        } else if (msgObj.content && typeof msgObj.content.content === "string") {
          text = msgObj.content.content;
        } else {
          text = JSON.stringify(msgObj.content || msgObj.message || "");
        }

        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)));
        return;
      }

      // 3) agent session update – store id only
      if (obj.agentSession && obj.agentSession.id) {
        setSessionId(obj.agentSession.id);
        return;
      }

      // 4) error event
      if (obj.error) {
        reportError(obj.error.message || "Stream error");
      }
    };

    try {
      if (selectedAgent) {
        // agent flow
        const url = sessionId
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-text/${sessionId}`
          : `${WIZE_TEAMS_BASE_URL}/ai-agent-run-text/${selectedAgent}`;
        const body = { message: userMsg.content };
        await streamSSE(url, body, headers, onEvent);
      } else if (selectedModel) {
        // model flow
        const isContinue = Boolean(sessionId);
        const url = isContinue
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-by-model/${sessionId}`
          : `${WIZE_TEAMS_BASE_URL}/ai-agent-run-by-model`;
        const body: any = {
          message: userMsg.content,
          model: { id: selectedModel, temperature },
        };
        await streamSSE(url, body, headers, onEvent);
      }
    } catch (err: any) {
      reportError(err.message || String(err));
    }
  };

  // UI helpers
  // memoize common style to avoid new object each render
  const controlStyle: React.CSSProperties = React.useMemo(() => ({
    backgroundColor: "var(--neutral-background)",
    color: "var(--text-primary)",
    border: "1px solid var(--neutral-outline)",
    borderRadius: 4,
  }), []);

  // Inline JSX blocks to keep DOM elements stable and avoid remounting

  const controlRow = (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap", // allow controls to flow to next line on small widths
        gap: 8,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <select
        value={
          selectedModel
            ? `model:${selectedModel}`
            : selectedAgent
            ? `agent:${selectedAgent}`
            : ""
        }
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          const val = e.target.value;

          // Handle deselection
          if (!val) {
            setSelectedModel("");
            setSelectedAgent("");
            return;
          }

          if (val.startsWith("model:")) {
            const nextModel = val.slice(6);
            const switchingFromAgentFlow = Boolean(selectedAgent);

            setSelectedModel(nextModel);
            setSelectedAgent(""); // leaving agent flow

            if (switchingFromAgentFlow) {
              resetSession();
            }
          } else if (val.startsWith("agent:")) {
            const nextAgent = val.slice(6);
            const switchingFromModelFlow = Boolean(selectedModel);
            const changingAgent = Boolean(selectedAgent) && selectedAgent !== nextAgent;

            setSelectedAgent(nextAgent);
            setSelectedModel(""); // leaving model flow

            if (switchingFromModelFlow || changingAgent) {
              resetSession();
            }
          }
        }}
        style={{ ...controlStyle, padding: 4 }}
      >
        <option value="">Select model or agent</option>
        {models.map((m: Model) => (
          <option key={`model:${m.id}`} value={`model:${m.id}`}>
            {m.id}
          </option>
        ))}
        {agents.map((a: Agent) => (
          <option key={`agent:${a.id}`} value={`agent:${a.id}`}>
            {a.meta?.name || a.id}
          </option>
        ))}
      </select>

      {selectedModel && (
        <input
          type="number"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(Number(e.target.value))}
          style={{ ...controlStyle, width: 60, padding: 2 }}
          title="Temperature"
        />
      )}

      <div
        onClick={startNewSession}
        title="New Session"
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <PlusIcon size={16} />
      </div>
    </div>
  );

  const chatWindow = (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 4px",
        borderRadius: 4,
      }}
    >
      {messages.map((msg: Message) => (
        <div
          key={msg.id}
          style={{
            marginBottom: 6,
            textAlign: msg.sender === "user" ? "right" : "left",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background:
                msg.sender === "user" ? "var(--primary-transparent-light)" : "var(--secondary-transparent-light)",
              padding: "6px 10px",
              borderRadius: 6,
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              fontSize: "12px"
            }}
          >
            {msg.content}
          </span>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  const isSendDisabled = !input.trim();

  const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = textareaHeight;

    const onMouseMove = (ev: MouseEvent) => {
      const diff = startY - ev.clientY; // moving up increases height
      setTextareaHeight(Math.max(70, startHeight + diff));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const inputRow = (
    <div style={{ display: "flex", marginTop: 8 }}>
      <div style={{ position: "relative", flex: 1 }}>
        <textarea
          ref={inputRef}
          value={input}
          rows={3}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter") {
              if (e.shiftKey) {
                // allow newline
                return;
              }
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          style={{
            ...controlStyle,
            width: "100%",
            height: textareaHeight,
            padding: 8,
            paddingRight: 36,
            resize: "none",
            fontSize: "14px",
            lineHeight: "1.4",
            minHeight: 70,
          }}
        />
        {/* custom drag handle */}
        <div
          onMouseDown={handleDragMouseDown}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 14,
            height: 14,
            cursor: "row-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--neutral-gray)",
            userSelect: "none",
          }}
        >
          ≡
        </div>
        {/* send button inside textarea container */}
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: isSendDisabled ? "not-allowed" : "pointer",
            color: isSendDisabled ? "var(--neutral-gray)" : "var(--primary)",
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );

  if (token === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {controlRow}
      {sessionId && (
        <div
          style={{
            fontSize: 10,
            color: "var(--neutral-gray)",
            margin: "0 0 4px 0",
            textAlign: "right",
          }}
        >
          Session: {sessionId}
        </div>
      )}
      {chatWindow}
      {inputRow}
    </div>
  );
} 