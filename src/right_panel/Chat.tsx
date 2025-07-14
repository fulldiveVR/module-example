import React, { useEffect, useRef, useState, useCallback } from "react";
import PlusIcon from "../components/PlusIcon";
import { CombinerRestClient, CombinerWebSocketClient, useBackend } from "aiwize-combiner-core";
import SendIcon from "../components/SendIcon";
import PageContentIcon from "../components/PageContentIcon";
import PageInfoIcon from "../components/PageInfoIcon";
import PageScreenshotIcon from "../components/PageScreenshotIcon";
import { getToken } from "../utils/auth";
import { WIZE_TEAMS_BASE_URL } from "../utils/api";
import { reportError } from "../utils/errorReporter";
import { MODULE_ID } from "@/hooks/useTheme";

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

// NEW: SimpleDocument interface for user's uploaded documents
interface SimpleDocument {
  id: string;
  title: string;
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
  // NEW: state for documents & picker
  const [docs, setDocs] = useState<SimpleDocument[]>([]);
  const [showDocPicker, setShowDocPicker] = useState<boolean>(false);
  const [docContentMap, setDocContentMap] = useState<Record<string, string>>({});

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
    let content = "";
    try {
      content = await browserBackend.getPageContent();
    } catch (e) {
      console.error("handleInsertPageContent error", e);
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
      console.error("handleInsertPageInfo error", e);
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
      console.error("handleInsertPageScreenshots error", e);
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
    const ws = new CombinerWebSocketClient({ moduleId: MODULE_ID, panel: "right" });
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

  // Reusable helper to load user's simple documents.
  // Defined with useCallback so it can be reused from effects/handlers.
  const fetchDocs = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`${WIZE_TEAMS_BASE_URL}/simple-documents?skip=0&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) {
        console.warn("[Chat] Failed to load documents", resp.status);
        return;
      }
      const data: SimpleDocument[] = await resp.json();
      setDocs(data);
    } catch (err) {
      console.error("[Chat] Error fetching documents", err);
    }
  }, [token]);

  // Initial load when token becomes available
  useEffect(() => {
    if (!token) return;
    fetchDocs();
  }, [token, fetchDocs]);

  // Lazy refresh every time the document picker is opened so the list stays up-to-date
  useEffect(() => {
    if (!showDocPicker) return;
    fetchDocs();
  }, [showDocPicker, fetchDocs]);

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
    combinerRef.current = new CombinerRestClient({ moduleId: MODULE_ID });
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

  // Helper: Expand @document_title placeholders with full content tags
  const expandDocumentPlaceholders = async (text: string): Promise<string> => {
    // Quick exit if there is no placeholder indicator.
    if (!text.includes("@")) return text;

    // Clone current cache so we can update it locally first.
    const updatedMap: Record<string, string> = { ...docContentMap };

    // Ensure we have content cached for every document that is referenced in the text.
    const cachingTasks = docs.map(async (doc) => {
      const placeholder = `@${doc.title}`;
      if (!text.includes(placeholder)) return; // not referenced

      // Already cached → nothing to do.
      if (updatedMap[doc.title]) return;

      // Cache the document content.
      updatedMap[doc.title] = doc.content;
    });

    await Promise.all(cachingTasks);

    // Do NOT persist the updated cache here – this function should ONLY expand
    // placeholders for the outgoing message so that the UI continues to show
    // the original @placeholders. Any caching is handled when the user picks a
    // document from the picker.

    // Replace placeholders with full content tags.
    let result = text;
    Object.entries(updatedMap).forEach(([title, content]) => {
      if (!content) return;
      const placeholder = `@${title}`;
      if (!result.includes(placeholder)) return;

      const replacement = `<${title}> {{${content}}}</${title}>`;
      result = result.split(placeholder).join(replacement);
    });

    return result;
  };

  // NEW: handler when user selects a document from picker
  const handleSelectDocument = async (doc: SimpleDocument) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const cursorPos = el.selectionStart ?? input.length;

    // If character right before cursor is '@', replace it, otherwise just insert.
    const hasTrailingAt = cursorPos > 0 && input[cursorPos - 1] === "@";
    const before = hasTrailingAt ? input.slice(0, cursorPos - 1) : input.slice(0, cursorPos);
    const after = input.slice(cursorPos);
    const newText = `${before}@${doc.title}${after}`;
    setInput(newText);

    // update cursor position after state update
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = before.length + doc.title.length + 1; // 1 for @
        inputRef.current.selectionStart = newPos;
        inputRef.current.selectionEnd = newPos;
        inputRef.current.focus();
      }
    }, 0);

    setShowDocPicker(false);

    // Cache content if not already present
    if (!docContentMap[doc.title]) {
      const content = doc.content;
      setDocContentMap((prev) => ({ ...prev, [doc.title]: content }));
    }
  };

  // Helper: Convert custom <tag>...<\/tag> into @tag for display
  const formatMessageContent = (text: string): string => {
    if (!text) return text;
    return text.replace(/<([^>]+?)>[\s\S]*?<\/\1>/g, (_match, tagName: string) => `@${tagName.trim()}`);
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
        // Update assistant message with streaming delta. If the placeholder has been
        // removed (e.g. after a session history reload that arrived mid-stream),
        // recreate it so the user can still see the assistant response.
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantId);
          if (existing) {
            return prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + String(obj.messageDelta) } : m,
            );
          }

          // Placeholder missing – create a new assistant message starting with the delta.
          return [
            ...prev,
            { id: assistantId, sender: "assistant", content: String(obj.messageDelta) },
          ];
        });
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
      // Expand document placeholders before sending
      const expandedInput = await expandDocumentPlaceholders(userMsg.content);

      if (selectedAgent) {
        // agent flow
        const url = agentSessionId
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-text/${agentSessionId}`
          : `${WIZE_TEAMS_BASE_URL}/ai-agent-run-text/${selectedAgent}`;
        const body = { message: expandedInput };
        await streamSSE(url, body, headers, onEvent);
      } else if (selectedModel) {
        // model flow
        const isContinue = Boolean(agentSessionId);
        const url = isContinue
          ? `${WIZE_TEAMS_BASE_URL}/ai-agent-continue-by-model/${agentSessionId}`
          : `${WIZE_TEAMS_BASE_URL}/ai-agent-run-by-model`;
        const body: any = {
          message: expandedInput,
          model: { id: selectedModel, temperature },
        };
        console.log("[Chat] Calling generation route", body.message);
        await streamSSE(url, body, headers, onEvent);
      }
    } catch (err: any) {
      reportError(err.message || String(err));
    }
  };

  // UI helpers
  // memoize common style to avoid new object each render
  const controlStyle: React.CSSProperties = React.useMemo(() => ({
    backgroundColor: "var(--color-surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--neutral-outline)",
    borderRadius: "var(--radius-md)",
    padding: "var(--spacing-sm) var(--spacing-md)",
    fontSize: "var(--font-size-sm)",
    fontFamily: "var(--font-family-primary)",
    transition: "all var(--transition-fast)",
  }), []);

  // Inline JSX blocks to keep DOM elements stable and avoid remounting

  const headerRow: React.ReactNode = (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: 64,
        alignItems: "center",
        padding: "0 var(--spacing-xl)",
        justifyContent: "space-between",
        flexWrap: "wrap", // allow second row for session label
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--neutral-outline)",
        boxShadow: "var(--shadow-sm)",
        backdropFilter: "blur(10px)",
        overflowX: "hidden", // avoid creating horizontal scrollbars
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, gap: "var(--spacing-md)" }}>
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
          className="input"
          style={{
            ...controlStyle,
            height: 36,
            flex: "1 1 200px", // let it shrink and wrap as needed
            minWidth: 0, // allow shrinking below intrinsic width
            maxWidth: "100%", // never exceed container width
            cursor: "pointer",
            boxSizing: "border-box",
            lineHeight: "normal",
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
            className="input"
            style={{
              ...controlStyle,
              width: 80,
              height: 36,
              textAlign: "center",
              boxSizing: "border-box",
              lineHeight: "normal",
            }}
            title="Temperature"
            placeholder="0.7"
          />
        )}

        {agentSessionId && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-xs)",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            backgroundColor: "var(--primary-transparent)",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 500,
            color: "var(--primary)",
            border: "1px solid var(--primary)",
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--primary)",
            }} />
            <span>Session: {agentSessionId.slice(-8)}</span>
          </div>
        )}
      </div>
    </div>
  );

  const chatWindow = (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--spacing-xl) var(--spacing-xl) 0 var(--spacing-xl)",
        backgroundColor: "var(--color-background)",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            className="fade-in"
            style={{
              marginBottom: "var(--spacing-lg)",
              display: "flex",
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "var(--spacing-md) var(--spacing-lg)",
                borderRadius: "var(--radius-lg)",
                backgroundColor: msg.sender === "user" ? "var(--primary)" : "var(--color-surface)",
                color: msg.sender === "user" ? "#fff" : "var(--text-primary)",
                boxShadow: "var(--shadow-sm)",
                fontSize: "var(--font-size-sm)",
                lineHeight: 1.6,
                border: msg.sender === "user" ? "none" : "1px solid var(--neutral-outline)",
                fontFamily: "var(--font-family-primary)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                position: "relative",
              }}
            >
              {msg.sender === "assistant" && (
                <div style={{
                  position: "absolute",
                  top: -8,
                  left: "var(--spacing-lg)",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid var(--color-surface)",
                }} />
              )}
              {msg.sender === "user" && (
                <div style={{
                  position: "absolute",
                  top: -8,
                  right: "var(--spacing-lg)",
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid var(--primary)",
                }} />
              )}
              <div style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                marginBottom: "var(--spacing-xs)",
                color: msg.sender === "user" ? "rgba(255, 255, 255, 0.8)" : "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                {msg.sender === "user" ? "You" : "Assistant"}
              </div>
              {formatMessageContent(msg.content)}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "var(--spacing-3xl)",
            color: "var(--text-tertiary)",
          }}>
            <div style={{
              fontSize: "var(--font-size-3xl)",
              marginBottom: "var(--spacing-lg)",
              opacity: 0.3,
            }}>
              💬
            </div>
            <div style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: 600,
              marginBottom: "var(--spacing-md)",
              color: "var(--text-primary)",
            }}>
              Welcome to AI Wize
            </div>
            <div style={{
              fontSize: "var(--font-size-md)",
              marginBottom: "var(--spacing-sm)",
            }}>
              Start a conversation with AI
            </div>
            <div style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-tertiary)",
            }}>
              Select a model or agent above and type your message below
            </div>
          </div>
        )}
      </div>
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
    <div style={{
      padding: "var(--spacing-md) var(--spacing-xl)",
      backgroundColor: "var(--color-surface)",
      borderTop: "1px solid var(--neutral-outline)",
      boxShadow: "var(--shadow-sm)",
      position: "relative",
    }}>
            <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        position: "relative",
      }}>
        {/* Action buttons above input */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-md)",
          opacity: 0.7,
        }}>
          <button
            onClick={startNewSession}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            title="Start new session"
          >
            <PlusIcon size={16} />
          </button>

          <button
            onClick={handleInsertPageContent}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            title="Insert page content"
          >
            <PageContentIcon size={16} />
          </button>

          <button
            onClick={handleInsertPageInfo}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            title="Insert page info"
          >
            <PageInfoIcon size={16} />
          </button>

          <button
            onClick={handleInsertPageScreenshots}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            title="Insert page screenshots"
          >
            <PageScreenshotIcon size={16} />
          </button>
        </div>

        <div style={{
          position: "relative",
          backgroundColor: "var(--color-background)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--neutral-outline)",
          overflow: "hidden",
          transition: "all var(--transition-fast)",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "@") {
                setShowDocPicker(true);
              } else if (e.key === "Escape") {
                setShowDocPicker(false);
              }
              if (e.key === "Enter") {
                if (e.shiftKey) {
                  // allow newline
                  return;
                }
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            style={{
              width: "100%",
              height: textareaHeight,
              padding: "var(--spacing-lg)",
              paddingBottom: "50px", // space for send button at bottom
              resize: "none",
              border: "none",
              outline: "none",
              fontSize: "var(--font-size-sm)",
              fontFamily: "var(--font-family-primary)",
              lineHeight: 1.5,
              backgroundColor: "transparent",
              color: "var(--text-primary)",
              minHeight: 100,
            }}
          />
          
          {/* Send button at bottom */}
          <button
            onClick={handleSend}
            disabled={isSendDisabled}
            style={{
              position: "absolute",
              bottom: "var(--spacing-md)",
              right: "var(--spacing-md)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: isSendDisabled ? "not-allowed" : "pointer",
              color: isSendDisabled ? "var(--text-tertiary)" : "var(--primary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: isSendDisabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSendDisabled) {
                e.currentTarget.style.color = "var(--primary-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSendDisabled) {
                e.currentTarget.style.color = "var(--primary)";
              }
            }}
            title="Send message (Enter)"
          >
            <SendIcon />
          </button>

          {/* Resize handle */}
          <div
            onMouseDown={handleDragMouseDown}
            style={{
              position: "absolute",
              top: 4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 40,
              height: 12,
              cursor: "row-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-tertiary)",
              userSelect: "none",
              fontSize: "var(--font-size-sm)",
              opacity: 0.5,
            }}
          >
            ⋯
          </div>
        </div>

                 {/* Document picker popover */}
         {showDocPicker && (
           <div
             style={{
               position: "absolute",
               bottom: textareaHeight + 60, // more space above input area
               right: 0,
               width: 280,
               maxHeight: 300,
               overflowY: "auto",
               backgroundColor: "var(--color-surface)",
               border: "1px solid var(--neutral-outline)",
               borderRadius: "var(--radius-lg)",
               boxShadow: "var(--shadow-lg)",
               zIndex: 1000,
             }}
           >
            <div style={{
              padding: "var(--spacing-md) var(--spacing-lg)",
              borderBottom: "1px solid var(--neutral-outline)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}>
              Select Document
            </div>
            <div style={{ padding: "var(--spacing-sm)" }}>
              {docs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDocument(d)}
                  className="list-item"
                  style={{
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    cursor: "pointer",
                    borderRadius: "var(--radius-md)",
                    fontSize: "var(--font-size-sm)",
                    transition: "all var(--transition-fast)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={d.title || d.id}
                >
                  {d.title || d.id}
                </div>
              ))}
              {docs.length === 0 && (
                <div style={{
                  padding: "var(--spacing-lg)",
                  textAlign: "center",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--text-tertiary)",
                }}>
                  No documents available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (token === undefined) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        backgroundColor: "var(--color-background)",
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
            fontSize: "var(--font-size-xl)",
            fontWeight: 600,
            marginBottom: "var(--spacing-md)",
            color: "var(--text-primary)",
          }}>
            Loading...
          </div>
          <div style={{ fontSize: "var(--font-size-md)" }}>
            Please wait while we initialize the chat
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflowX: "hidden", // ensure no horizontal scroll for the entire panel
        backgroundColor: "var(--color-background)",
        fontFamily: "var(--font-family-primary)",
      }}
    >
      {headerRow}
      {chatWindow}
      {inputRow}
    </div>
  );
} 