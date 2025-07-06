// You should not change this file.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const appContainer = document.createElement("div");
appContainer.style.position = "fixed";
appContainer.style.top = "0";
appContainer.style.left = "0";
appContainer.style.width = "270px";
appContainer.style.height = "100vh";
appContainer.style.background = "#fff";
appContainer.style.zIndex = "9999";
appContainer.style.display = "flex";
appContainer.style.flexDirection = "column";
appContainer.style.fontFamily = "Inter, sans-serif";
appContainer.style.borderRight = "1px solid #e0e0e0";
appContainer.style.overflow = "auto";

const shadowRoot = appContainer.attachShadow({ mode: "open" });

document.body.appendChild(appContainer);

const root = ReactDOM.createRoot(shadowRoot);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
