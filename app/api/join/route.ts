import { NextResponse } from "next/server";
import { currentUserId, decrypt, env, supabaseRequest } from "@/lib/server";
export const runtime = "nodejs";
export async function POST() {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Connect your Discord account first." }, { status: 401 });
    const lookup = await supabaseRequest(`member_authorizations?select=token_bundle_enc,expires_at&discord_user_id=eq.${encodeURIComponent(userId)}&limit=1`);
    if (!lookup.ok) return NextResponse.json({ error: "Could not check your authorization." }, { status: 500 });
    const rows = await lookup.json();
    if (!rows.length) return NextResponse.json({ error: "Authorization not found. Connect Discord again." }, { status: 401 });
    let tokens = JSON.parse(decrypt(rows[0].token_bundle_enc));
    if (new Date(rows[0].expires_at).getTime() < Date.now() + 30000) {
      if (!tokens.refresh_token) return NextResponse.json({ error: "Your Discord authorization expired. Please reconnect." }, { status: 401 });
      const refreshBody = new URLSearchParams({ client_id: env("DISCORD_CLIENT_ID"), client_secret: env("DISCORD_CLIENT_SECRET"), grant_type: "refresh_token", refresh_token: tokens.refresh_token });
      const refreshed = await fetch("https://discord.com/api/v10/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: refreshBody });
      if (!refreshed.ok) return NextResponse.json({ error: "Authorization expired. Please reconnect Discord." }, { status: 401 });
      tokens = await refreshed.json();
      const saved = await supabaseRequest(`member_authorizations?discord_user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ token_bundle_enc: encrypt(JSON.stringify({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, scope: tokens.scope })), expires_at: new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString(), updated_at: new Date().toISOString() }) });
      if (!saved.ok) return NextResponse.json({ error: "Could not update authorization." }, { status: 500 });
    }
    const response = await fetch(`https://discord.com/api/v10/guilds/${env("DEST_GUILD_ID")}/members/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: { Authorization: "Bot " + env("DISCORD_BOT_TOKEN"), "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: tokens.access_token })
    });
    if (response.status === 201 || response.status === 204) return NextResponse.json({ message: "Success! Your Discord account has joined the server." });
    const detail = await response.text();
    if (response.status === 403) return NextResponse.json({ error: "The bot is missing permission or is not configured for this server." }, { status: 403 });
    if (response.status === 401) return NextResponse.json({ error: "Discord rejected the bot credentials. Check the configured bot token." }, { status: 401 });
    return NextResponse.json({ error: "Discord could not add this account. Check that the OAuth app, bot, and destination server are configured correctly.", detail: detail.slice(0, 300) }, { status: 502 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error." }, { status: 500 }); }
}
