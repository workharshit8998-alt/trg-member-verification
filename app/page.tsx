"use client";
import { useEffect, useState } from "react";
type State = { connected: boolean; username?: string; error?: string };
export default function Home() {
  const [state, setState] = useState<State>({ connected: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function refresh() {
    try { const r = await fetch("/api/me", { cache: "no-store" }); const d = await r.json(); setState(d); }
    catch { setState({ connected: false }); }
  }
  useEffect(() => { refresh(); const p = new URLSearchParams(location.search); if (p.has("connected")) setMessage("Discord account connected. You can now choose to join the server."); if (p.has("error")) setMessage("Authorization was not completed. Please try again."); }, []);
  async function join() {
    setBusy(true); setMessage("");
    try { const r = await fetch("/api/join", { method: "POST" }); const d = await r.json(); setMessage(r.ok ? d.message : (d.error || "Could not join the server.")); }
    catch { setMessage("Network error. Please try again."); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true);
    try { await fetch("/api/disconnect", { method: "POST" }); setState({ connected: false }); setMessage("Your saved authorization has been disconnected."); }
    finally { setBusy(false); }
  }
  return <main className="shell"><section className="panel">
    <div className="brand">TRG COMMUNITY</div><div className="orb">T</div>
    <span className="tag">SECURE MEMBER VERIFICATION</span>
    <h1 className="title">Join the community.</h1>
    <p className="muted">Connect your own Discord account, review the requested permission, then choose whether to join the server. Nothing happens until you press the join button.</p>
    {state.connected ? <>
      <div className="status">Connected as <b>{state.username || "your Discord account"}</b>. Your account has authorized this app.</div>
      <div className="actions"><button className="btn primary" disabled={busy} onClick={join}>{busy ? "Please wait…" : "Join Discord Server"}</button><button className="btn secondary" disabled={busy} onClick={disconnect}>Disconnect authorization</button></div>
    </> : <div className="actions"><a className="btn primary" href="/api/oauth/start">Continue with Discord</a></div>}
    {message && <div className="status" role="status">{message}</div>}
    <div className="foot">By continuing, Discord will show you the permissions requested by this app. You can cancel at any time. Disconnecting here removes the stored authorization; you can also revoke access in Discord → User Settings → Authorized Apps.</div>
  </section></main>;
}
