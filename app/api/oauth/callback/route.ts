import { NextRequest, NextResponse } from "next/server";
import { appUrl, encrypt, env, makeSession, supabaseRequest } from "@/lib/server";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const origin = appUrl();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("trg_oauth_state")?.value;
  const fail = (reason: string) => NextResponse.redirect(new URL("/?error=" + encodeURIComponent(reason), origin));
  if (!code || !state || !savedState || state !== savedState) return fail("state");
  try {
    const body = new URLSearchParams({ client_id: env("DISCORD_CLIENT_ID"), client_secret: env("DISCORD_CLIENT_SECRET"), grant_type: "authorization_code", code, redirect_uri: env("DISCORD_REDIRECT_URI") });
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!tokenRes.ok) return fail("token_exchange");
    const tokens = await tokenRes.json();
    const userRes = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!userRes.ok) return fail("discord_user");
    const user = await userRes.json();
    const expiresAt = new Date(Date.now() + Number(tokens.expires_in || 604800) * 1000).toISOString();
    const stored = await supabaseRequest("member_authorizations?on_conflict=discord_user_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ discord_user_id: String(user.id), token_bundle_enc: encrypt(JSON.stringify({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, scope: tokens.scope })), expires_at: expiresAt, updated_at: new Date().toISOString() })
    });
    if (!stored.ok) return fail("database");
    const response = NextResponse.redirect(new URL("/?connected=1", origin));
    response.cookies.set("trg_session", makeSession(String(user.id)), { httpOnly: true, secure: origin.startsWith("https://"), sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("trg_oauth_state", "", { httpOnly: true, secure: origin.startsWith("https://"), sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch { return fail("server"); }
}
