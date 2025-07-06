import { useState } from "react";
import { getLocalizedString } from "../../lib/i18n";

const Input = () => {
  const [value, setValue] = useState("");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <input
        type="text"
        style={{
          width: "80%",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid var(--text-color)",
          background: "transparent",
          color: "var(--text-color)",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "inherit",
          outline: "none",
        }}
        placeholder={getLocalizedString("aiwizeCombinerPlaceholder", "Read page content")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
};

export default Input;
