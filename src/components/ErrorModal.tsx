import React from "react";

interface ErrorModalProps {
  message: string | null;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "var(--color-background)",
  padding: "24px 32px",
  borderRadius: 8,
  maxWidth: 400,
  textAlign: "center",
  color: "var(--text-primary)",
  border: "1px solid var(--text-primary)",
};

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <p style={{ marginBottom: 16 }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            padding: "6px 12px",
            backgroundColor: "transparent",
            color: "var(--text-primary)",
            border: "1px solid var(--text-primary)",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal; 