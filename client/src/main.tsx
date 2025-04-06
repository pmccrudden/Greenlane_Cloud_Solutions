import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// If Stripe not configured, show a warning on console in dev mode
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY && import.meta.env.DEV) {
  console.warn(
    "Stripe public key is not configured. Set VITE_STRIPE_PUBLIC_KEY in environment variables."
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
