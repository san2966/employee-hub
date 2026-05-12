import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function renderStartupError(message: string) {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
      <section style="max-width:720px;width:100%;background:#ffffff;border:1px solid #cbd5e1;border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;">Application configuration error</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${message}</p>
        <ol style="margin:0;padding-left:20px;line-height:1.8;">
          <li>Verify the frontend was rebuilt with production environment values.</li>
          <li>Confirm <code>VITE_SUPABASE_URL</code> points to your production backend.</li>
          <li>Confirm <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> is the production anon/publishable key.</li>
          <li>Clear browser cache after redeploying the frontend.</li>
        </ol>
      </section>
    </main>
  `;
}

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in the frontend build. This usually causes the blank page issue after deployment."
    );
  }

  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error("Startup error:", error);
  renderStartupError(error instanceof Error ? error.message : "Unknown startup error");
}
