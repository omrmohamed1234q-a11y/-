import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFirebaseDebugTools } from "./lib/firebase-debug";

// Initialize Firebase debug tools for console testing
if (import.meta.env.DEV) {
  initFirebaseDebugTools();
}

createRoot(document.getElementById("root")!).render(<App />);
