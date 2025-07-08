import React from "react";
import { useLoggedIn } from "../hooks/useLoggedIn";

function App() {
  const loggedIn = useLoggedIn();

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f8ff",
    fontFamily: "Arial, sans-serif",
    fontSize: "18px",
    color: "#333",
  };

  if (loggedIn === false) {
    return <div style={containerStyle}>Please login</div>;
  }

  return (
    <div style={{ ...containerStyle, position: "relative" }}>
      Hello World (Right Panel)
    </div>
  );
}

export default App;
