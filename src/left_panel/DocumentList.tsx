import React, { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import {
  WIZE_TEAMS_BASE_URL,
  WIZE_TEAMS_UI_BASE_URL,
} from "../utils/api";
import { useBackend } from "aiwize-combiner-core";
import ReloadIcon from "../components/ReloadIcon";

interface SimpleDocument {
  id: string;
  title: string;
  // other fields are ignored for list rendering
}

interface DocumentListProps {
  width?: number | string;
}

export default function DocumentList({ width = "100%" }: DocumentListProps) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [docs, setDocs] = useState<SimpleDocument[]>([]);
  const [expanded, setExpanded] = useState(false);
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
        maxHeight: "60%",
        overflowY: expanded ? "auto" : "hidden",
        padding: 8,
        boxSizing: "border-box",
        backgroundColor: "var(--color-background)",
        color: "var(--text-primary)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        {/* Expand/collapse control */}
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            flexGrow: 1,
          }}
        >
          <span style={{ fontSize: 12, marginRight: 4 }}>
            {expanded ? "▼" : "▶"}
          </span>
          <h3 style={{ margin: 0, fontSize: 14 }}>Documents</h3>
        </div>
        {/* Reload button */}
        {token && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchDocs(token);
            }}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
            title="Reload documents"
          >
            {/* We use currentColor so icon inherits text */}
            <ReloadIcon size={12} />
          </button>
        )}
      </div>
      {expanded && (
        <>
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => openDocument(doc.id)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {doc.title || doc.id}
            </div>
          ))}
          {docs.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--neutral-gray)" }}>
              No documents
            </div>
          )}
        </>
      )}
    </div>
  );
} 