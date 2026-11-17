"use client";

import { useEffect, useState } from "react";

type State = { connected: boolean; username?: string };

export default function Home() {
  const [state, setState] = useState<State>({ connected: false });
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json();
      setState(data);
    } catch {
      setState({ connected: false });
    }
  }

  useEffect(() => {
    refresh();
    const params = new URLSearchParams(window.location.search);
    if (params.has("connected")) {
      setMessage("Discord connected. Press Verify Now to finish.");
    } else if (params.has("error")) {
      setMessage("Verification could not be completed. Please try again.");
    }
  }, []);

  async function verify() {
    if (!state.connected) {
      window.location.href = "/api/oauth/start";
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/join", { method: "POST" });
      const data = await response.json();
      if (response.ok) {
        setVerified(true);
        setMessage(data.message || "Verification complete. You're all set!");
      } else {
        setMessage(data.error || "Verification failed. Please try again.");
      }
    } catch {
      setMessage("Connection error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="verify-shell">
      <section className="verify-card" aria-labelledby="verify-title">
        <div className="verify-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M12 2.8 19 5.5v5.8c0 4.6-2.9 8.2-7 9.9-4.1-1.7-7-5.3-7-9.9V5.5l7-2.7Z" />
            <path d="m8.7 12.1 2.1 2.1 4.6-4.7" />
          </svg>
        </div>
        <div className="verify-brand">TRG COMMUNITY</div>
        <h1 id="verify-title">{verified ? "You're verified!" : "Are you a robot?"}</h1>
        <p className="verify-description">
          {verified
            ? "Your Discord verification is complete."
            : "Complete a quick Discord verification to continue to the community."}
        </p>
        {!verified && (
          <button className="verify-button" onClick={verify} disabled={busy}>
            {busy ? "Please wait…" : "Verify Now"}
            {!busy && <span aria-hidden="true">→</span>}
          </button>
        )}
        {message && (
          <p className={verified ? "verify-message success" : "verify-message"} role="status">
            {message}
          </p>
        )}
        <div className="verify-footer">
          Official Discord authorization · Your Discord password is never shared with this site
        </div>
      </section>
    </main>
  );
}
