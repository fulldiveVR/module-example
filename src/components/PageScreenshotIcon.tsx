import React from "react";

export default function PageScreenshotIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* Camera body */}
      <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Lens */}
      <circle cx="8" cy="8.5" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Top bar */}
      <rect x="4" y="2" width="8" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
} 