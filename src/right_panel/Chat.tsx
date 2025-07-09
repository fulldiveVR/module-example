import React, { useEffect, useRef, useState } from "react";
import PlusIcon from "../components/PlusIcon";
import { CombinerRestClient, CombinerWebSocketClient, useBackend } from "aiwize-combiner-core";
import SendIcon from "../components/SendIcon";
import PageContentIcon from "../components/PageContentIcon";
import PageInfoIcon from "../components/PageInfoIcon";
import PageScreenshotIcon from "../components/PageScreenshotIcon";
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

// WebSocket event types
const EVT_OPEN_SESSION = "OPEN_SESSION";
const EVT_SESSION_ACTIVE = "SESSION_ACTIVE";

export default function Chat() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [models, setModels] = useState<Model[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [msgSessionId, setMsgSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Combiner REST client (persisted via ref to avoid re-instantiation)
  const combinerRef = useRef<CombinerRestClient | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  // Indicates that initial chat_state has been fetched (or attempted)
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  // Add debug logging for session id changes

  const [textareaHeight, setTextareaHeight] = useState<number>(120);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const browserBackend = useBackend();
  // Helper to insert text at the current cursor position inside the textarea
  const insertAtCursor = (text: string) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const newVal = input.slice(0, start) + text + input.slice(end);
    setInput(newVal);
    // Restore focus and cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const pos = start + text.length;
        inputRef.current.selectionStart = pos;
        inputRef.current.selectionEnd = pos;
      }
    }, 0);
  };

  // Insert <page-content>...</page-content> at cursor
  const handleInsertPageContent = async () => {
    console.log("handleInsertPageContent");
    let content = "";
    try {
      content = await browserBackend.getPageContent();
    } catch (e) {
      console.log("handleInsertPageContent error", e);
      /* ignore errors – will fallback to mock */
    }
    if (!content || !content.length) content = "Mock page content";
    insertAtCursor(`<page-content>${content}</page-content>`);
  };

  // Insert <page-info>...</page-info> at cursor
  const handleInsertPageInfo = async () => {
    let info: string [] | undefined;
    try {
      info = await browserBackend.getPageInfo();
    } catch (e) {
      console.log("handleInsertPageInfo error", e);
      /* ignore errors – will fallback to mock */
    }
    if (!info || !info.length) info = ["Mock page info"];
    insertAtCursor(`<page-info>${info.join(", ")}</page-info>`);
  };

  // Insert <page-screenshots>...</page-screenshots> at cursor
  const handleInsertPageScreenshots = async () => {
    let shots: string[] = [];
    try {
      shots = await browserBackend.getPageScreenshots();
    } catch (e) {
      console.log("handleInsertPageScreenshots error", e);
      /* ignore errors – will fallback to mock */
    }
    if (!shots || !shots.length) shots = ["mock-base64"];
    insertAtCursor(`<page-screenshots>${shots.join(",")}</page-screenshots>`);
  };

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

  // WebSocket ref
  const wsRef = useRef<CombinerWebSocketClient | null>(null);

  // Establish WS connection once on mount
  useEffect(() => {
    const ws = new CombinerWebSocketClient({ moduleId: "module-example-aiwize-chat", panel: "right" });
    wsRef.current = ws;

    const processMessageObj = (msg: any) => {
      if (!msg || typeof msg !== "object") return;
      if (msg.type === EVT_OPEN_SESSION && msg.payload) {
        // eslint-disable-next-line no-console
        const payload = msg.payload;
        // Apply agent/model selection rules
        if (payload.agentId) {
          setSelectedAgent(payload.agentId);
          setSelectedModel("");
        } else if (payload.model && payload.model.id) {
          setSelectedModel(payload.model.id);
          setSelectedAgent("");
          if (typeof payload.model.temperature === "number") {
            setTemperature(payload.model.temperature);
          }
        } else {
          // Clear current selection so that fallback hook can assign default model
          setSelectedAgent("");
          setSelectedModel("gpt-4o-mini");
          setTemperature(0.7);
        }

        setAgentSessionId(payload.id ?? null);
        setMsgSessionId(payload.sessionId ?? null);
        setMessages([]);
      }
    };

    ws.on("json", processMessageObj);
    ws.on("message", (raw: any) => {
      if (raw instanceof Blob) {
        raw.text().then((txt: string) => {
          try {
            const parsed = JSON.parse(txt);
            processMessageObj(parsed);
          } catch {}
        });
      }
    });

    ws.connect().catch((err: any) => {
      // eslint-disable-next-line no-console
      console.error("[Chat] WS connect error", err);
    });

    return () => {
      ws.disconnect();
    };
  }, []);

  // Announce active session to other panels whenever it changes
  useEffect(() => {
    if (!wsRef.current || !agentSessionId || !msgSessionId) return;
    wsRef.current.send({ type: EVT_SESSION_ACTIVE, payload: { id: agentSessionId, sessionId: msgSessionId } });
  }, [agentSessionId, msgSessionId]);

  // Removed localStorage event handling – now handled via WebSocket

  // Fetch messages whenever we have both a token and a session id
  useEffect(() => {
    if (!token || !msgSessionId) return;

    (async () => {
      try {
        // eslint-disable-next-line no-console
        const resp = await fetch(
          `${WIZE_TEAMS_BASE_URL}/sessions/${msgSessionId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
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
          console.warn("[Chat] Unable to fetch session messages", resp.status);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[Chat] Error fetching history", err);
      }
    })();
  }, [token, msgSessionId]);

  // Fallback when no agent/model supplied – default to first available model once we have the list
  useEffect(() => {
    if (!agentSessionId && !msgSessionId) return; // only care when a session is active
    if (selectedAgent || selectedModel) return; // already configured
    if (!models.length) return; // models not loaded yet

    // eslint-disable-next-line no-console
    setSelectedModel(models[0].id);
    setTemperature(0.7);
  }, [agentSessionId, msgSessionId, selectedAgent, selectedModel, models]);

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
          setAgentSessionId(last.agentSessionId ?? last.sessionId ?? null);
          setMsgSessionId(last.msgSessionId ?? last.historySessionId ?? null);
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
        const payload = { agentSessionId, msgSessionId, messages, selectedAgent, selectedModel, temperature };
        if (docId) {
          await combinerRef.current!.dbUpdate("chat_state", docId, payload);
        } else {
          // Only create a new doc if there's meaningful data.
          if (
            agentSessionId !== null ||
            msgSessionId !== null ||
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
  }, [agentSessionId, msgSessionId, messages, selectedAgent, selectedModel, temperature, isLoaded]);

  // Clears only conversation (keeps current model/agent settings)
  const resetSession = () => {
    setAgentSessionId(null);
    setMsgSessionId(null);
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
      if (obj.agentSession) {
        if (obj.agentSession.id) setAgentSessionId(obj.agentSession.id);
        if (obj.agentSession.sessionId) setMsgSessionId(obj.agentSession.sessionId);
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
        const url = agentSessionId
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-text/${agentSessionId}`
          : `${WIZE_TEAMS_BASE_URL}/ai-agent-run-text/${selectedAgent}`;
        const body = { message: userMsg.content };
        await streamSSE(url, body, headers, onEvent);
      } else if (selectedModel) {
        // model flow
        const isContinue = Boolean(agentSessionId);
        const url = isContinue
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-by-model/${agentSessionId}`
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
    borderTop: "1px solid var(--neutral-outline)",
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
        overflowX: "hidden", // avoid creating horizontal scrollbars
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
        style={{
          ...controlStyle,
          padding: 4,
          flex: "1 1 200px", // let it shrink and wrap as needed
          minWidth: 0, // allow shrinking below intrinsic width
          maxWidth: "100%", // never exceed container width
          boxSizing: "border-box",
        }}
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
          style={{ ...controlStyle, width: 60, padding: 2, fontSize: 12 }}
          title="Temperature"
        />
      )}

      {/* removed session + page controls (moved to textarea) */}
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
          rows={4}
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
            fontSize: "12px",
            lineHeight: "1.4",
            minHeight: 90,
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
            right: 1,
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

        {/* new session (plus) button */}
        <button
          onClick={startNewSession}
          title="New Session"
          style={{
            position: "absolute",
            top: 20,
            right: 1,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          <PlusIcon size={11} />
        </button>

        {/* page content button */}
        <button
          onClick={handleInsertPageContent}
          title="Insert page content"
          style={{
            position: "absolute",
            top: 42,
            right: 1,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          <PageContentIcon size={11} />
        </button>

        {/* page info button */}
        <button
          onClick={handleInsertPageInfo}
          title="Insert page info"
          style={{
            position: "absolute",
            top:64,
            right: 1,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          <PageInfoIcon size={12} />
        </button>

        {/* page screenshots button */}
        <button
          onClick={handleInsertPageScreenshots}
          title="Insert page screenshots"
          style={{
            position: "absolute",
            top: 86,
            right: 1,
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--primary)",
          }}
        >
          <PageScreenshotIcon size={12} />
        </button>
      </div>
    </div>
  );

  if (token === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflowX: "hidden", // ensure no horizontal scroll for the entire panel
      }}
    >
      {controlRow}
      {agentSessionId && (
        <div
          style={{
            fontSize: 10,
            color: "var(--neutral-gray)",
            margin: "0 0 4px 0",
            textAlign: "right",
          }}
        >
          Session: {agentSessionId}
        </div>
      )}
      {chatWindow}
      {inputRow}
    </div>
  );
} 