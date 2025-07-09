import React from "react";

export default function PageContentIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <rect
        x="2"
        y="1"
        width="12"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <line x1="4" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1" />
      <line x1="4" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
} 