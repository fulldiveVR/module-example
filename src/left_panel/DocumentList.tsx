import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import {
  WIZE_TEAMS_BASE_URL,
  WIZE_TEAMS_UI_BASE_URL,
} from "../utils/api";
import { useBackend } from "aiwize-combiner-core";
import ReloadIcon from "../components/ReloadIcon";
import DeleteIcon from "../components/DeleteIcon";

interface SimpleDocument {
  id: string;
  title: string;
  updated?: string;
  // other fields are ignored for list rendering
}

interface DocumentListProps {
  width?: number | string;
}

export default function DocumentList({ width = "100%" }: DocumentListProps) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [docs, setDocs] = useState<SimpleDocument[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const backend = useBackend();

  // Load auth token once
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, []);

  // Util function to fetch documents so we can call it from multiple places
  const fetchDocs = async (t: string) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${WIZE_TEAMS_BASE_URL}/simple-documents?skip=0&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${t}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!resp.ok) {
        // eslint-disable-next-line no-console
        console.error("Failed to load documents", resp.status);
        return;
      }
      const data: SimpleDocument[] = await resp.json();
      setDocs(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error fetching documents", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!token) return;
    try {
      const resp = await fetch(`${WIZE_TEAMS_BASE_URL}/simple-documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok && resp.status !== 204) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete document", resp.status);
        return;
      }
      // Optimistically remove from list
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting document", err);
    }
  };

  // Fetch documents when token ready
  useEffect(() => {
    if (!token) return;
    fetchDocs(token);
  }, [token]);

  const openDocument = (docId: string) => {
    backend.openLink(`${WIZE_TEAMS_UI_BASE_URL}/documents?documentId=${docId}`);
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
        style={{
          padding: "var(--spacing-md) var(--spacing-lg)",
          display: "flex",
          alignItems: "center",
          backgroundColor: expanded ? "var(--neutral-light-gray-hover)" : "transparent",
          borderBottom: expanded ? "1px solid var(--neutral-outline)" : "none",
          transition: "all var(--transition-fast)",
          userSelect: "none",
        }}
      >
        {/* Expand/collapse control */}
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            flex: 1,
            gap: "var(--spacing-sm)",
          }}
        >
          <div style={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            Documents
          </h3>
          <div style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--text-tertiary)",
            fontWeight: 500,
            backgroundColor: "var(--neutral-light-gray-hover)",
            padding: "var(--spacing-xs) var(--spacing-sm)",
            borderRadius: "var(--radius-full)",
          }}>
            {docs.length}
          </div>
        </div>

        {/* Reload button */}
        {token && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!loading) fetchDocs(token);
            }}
            style={{
              padding: "var(--spacing-sm)",
              marginLeft: "var(--spacing-sm)",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              color: "var(--text-secondary)",
              transition: "color var(--transition-fast)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Reload documents"
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <div style={{
              animation: loading ? "spin 1s linear infinite" : "none",
            }}>
              <ReloadIcon size={16} />
            </div>
          </div>
        )}
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
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => openDocument(doc.id)}
                className="list-item"
                style={{
                  padding: "var(--spacing-sm)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  backgroundColor: "transparent",
                  border: "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--success-main)",
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
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {doc.title || doc.id}
                  </div>
                  <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--text-tertiary)",
                    fontFamily: "monospace",
                  }}>
                    {doc.updated ? new Date(doc.updated).toLocaleDateString() : doc.id.slice(-8)}
                  </div>
                </div>
                {/* Delete button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDoc(doc.id);
                  }}
                  style={{
                    padding: "var(--spacing-xs)",
                    color: "var(--text-tertiary)",
                    opacity: 0.7,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Delete document"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--error-main)";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-tertiary)";
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  <DeleteIcon size={14} />
                </div>
              </div>
            ))}
          </div>
          {docs.length === 0 && (
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
                📄
              </div>
              <div style={{ fontWeight: 500, marginBottom: "var(--spacing-xs)" }}>
                No documents yet
              </div>
              <div style={{ fontSize: "var(--font-size-xs)" }}>
                Upload documents to see them here
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 

// Add spin animation for loading state
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 