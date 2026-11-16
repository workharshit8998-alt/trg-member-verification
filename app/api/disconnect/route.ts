import { NextResponse } from "next/server";
import { currentUserId, supabaseRequest } from "@/lib/server";
export const runtime = "nodejs";
export async function POST() {
  const id = await currentUserId();
  if (id) {
    const r = await supabaseRequest(`member_authorizations?discord_user_id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!r.ok) return NextResponse.json({ error: "Could not remove the saved authorization." }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("trg_session", "", { httpOnly: true, secure: (process.env.APP_URL || "").startsWith("https://"), sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
