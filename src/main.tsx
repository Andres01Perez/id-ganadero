import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Always unregister any existing service workers and clear caches.
// This auto-cleans users that previously installed the PWA with a SW.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {
    /* ignore */
  });
}
if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((k) => caches.delete(k));
  }).catch(() => {
    /* ignore */
  });
}

createRoot(document.getElementById("root")!).render(<App />);
