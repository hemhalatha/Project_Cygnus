import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import FreighterAPI from "@stellar/freighter-api";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  (window as unknown as { freighterApi: typeof FreighterAPI }).freighterApi = FreighterAPI;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
