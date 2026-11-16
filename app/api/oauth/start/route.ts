import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { appUrl, env } from "@/lib/server";
export const runtime = "nodejs";
export async function GET() {
  const state = randomBytes(24).toString("hex");
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", env("DISCORD_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", env("DISCORD_REDIRECT_URI"));
  url.searchParams.set("scope", "identify guilds.join");
  url.searchParams.set("state", state);
  const response = NextResponse.redirect(url);
  response.cookies.set("trg_oauth_state", state, { httpOnly: true, secure: appUrl().startsWith("https://"), sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
