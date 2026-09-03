import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeGamePersistence } from "./services/gameStateManager";

// Hydrate saved game state and calculate offline tick delta without useEffect
initializeGamePersistence();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
