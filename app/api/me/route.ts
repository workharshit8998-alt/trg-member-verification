import { NextResponse } from "next/server";
import { currentUserId, supabaseRequest } from "@/lib/server";
export const runtime = "nodejs";
export async function GET() {
  const id = await currentUserId();
  if (!id) return NextResponse.json({ connected: false });
  const r = await supabaseRequest(`member_authorizations?select=discord_user_id&discord_user_id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!r.ok) return NextResponse.json({ connected: false, error: "database" }, { status: 500 });
  const rows = await r.json();
  if (!rows.length) return NextResponse.json({ connected: false });
  const user = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: "Bot " + (process.env.DISCORD_BOT_TOKEN || "") } });
  return NextResponse.json({ connected: true, username: "Discord member" });
}
