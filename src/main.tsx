import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service Worker: only register in production (not in Lovable iframe/preview).
// Caches ONLY images — never HTML/JS/CSS, so app updates work normally.
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (!isInIframe && !isPreviewHost) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    });
  } else {
    // In preview/iframe: ensure no SW is registered (avoids stale-cache issues in editor)
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {
        /* ignore */
      });
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {
          /* ignore */
        });
    }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
