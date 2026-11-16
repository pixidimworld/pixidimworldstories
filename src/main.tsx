import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { Scene } from "./Scene";
import "./styles.css";
import "./mobile-reader-catalog.css";
import "./desktop-reader-flip.css";
import "./story-concept-drawer.css";

if (import.meta.env.PROD) inject({ mode: "production" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Scene />
  </StrictMode>,
);
