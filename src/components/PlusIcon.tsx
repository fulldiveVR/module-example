import React from "react";

// A plus (add) icon that inherits the current text color.
export default function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C8.49092 0 8.88889 0.397969 8.88889 0.888889V7.11111H15.1111C15.602 7.11111 16 7.50908 16 8C16 8.49092 15.602 8.88889 15.1111 8.88889H8.88889V15.1111C8.88889 15.602 8.49092 16 8 16C7.50908 16 7.11111 15.602 7.11111 15.1111V8.88889H0.888889C0.397969 8.88889 0 8.49092 0 8C0 7.50908 0.397969 7.11111 0.888889 7.11111H7.11111V0.888889C7.11111 0.397969 7.50908 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  );
} 