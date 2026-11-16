import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { Scene } from "./Scene";
import "./styles.css";
import "./mobile-reader-catalog.css";
import "./desktop-reader-flip.css";
import "./story-concept-drawer.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Scene />
    <Analytics />
  </StrictMode>,
);
