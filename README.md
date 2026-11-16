# TRG Member Verification

A standalone Next.js app for consent-based Discord OAuth and an explicit Join Server action. This repository is independent of the Discord bot repository.

## Flow
1. Member clicks **Continue with Discord**.
2. Discord asks the member to authorize `identify guilds.join`.
3. The callback stores the member's OAuth tokens encrypted in Supabase.
4. Member separately clicks **Join Discord Server**.
5. The server uses the bot token and that member's OAuth access token to request the guild join.

No bulk imports, silent joins, selfbots, or use of other people's stored accounts.

## Setup
1. Import this repository into Vercel as a new project.
2. Add every variable in `.env.example` in Vercel Project → Settings → Environment Variables.
3. Set `APP_URL` to the deployed HTTPS URL.
4. Set `DISCORD_REDIRECT_URI` to `https://YOUR-DOMAIN/api/oauth/callback`.
5. In Discord Developer Portal, add that exact redirect URI to OAuth2 → Redirects. Use the same Discord application for client ID, client secret, and bot.
6. Invite the bot to the destination server with the permissions required by your server. The bot must be in the destination guild.
7. Redeploy after setting environment variables.

Generate `TOKEN_ENCRYPTION_KEY` as 32 random bytes encoded as 64 hex characters. Generate `SESSION_SECRET` as a long random secret. Never commit real secrets or expose the Supabase service-role key in browser code.

## Required Vercel environment variables
- `APP_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_REDIRECT_URI`
- `DEST_GUILD_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TOKEN_ENCRYPTION_KEY`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SERVER_NAME`

## Supabase
The app expects the private `public.member_authorizations` table with `discord_user_id` (primary key), `token_bundle_enc`, `expires_at`, `created_at`, and `updated_at`. Keep RLS enabled and do not grant anon/authenticated access. The service-role key is used only by server routes.

## Optional bot panel
The separate file `bot_integration/member_pull_panel.py` registers a `!setup_pull_panel` command on a discord.py bot. Copy that file into your existing bot project only when you are ready; this repository does not modify the existing bot. Then add this to your bot startup code, replacing the URL with your deployed site URL:

```py
from member_pull_panel import setup_member_pull_panel

setup_member_pull_panel(bot, "https://YOUR-VERCEL-DOMAIN")
```

The command requires Manage Server permission and posts a link button to the consent-based website.

## Notes
- OAuth authorization is user-initiated and consent-based.
- A member is only added after pressing the Join Server button.
- A Discord bot token and OAuth client credentials must belong to the same Discord application.
- Disconnect removes the saved encrypted token bundle from Supabase. Members may additionally revoke the app under Discord Authorized Apps.
