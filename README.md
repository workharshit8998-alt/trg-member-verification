# TRG Member Verification

A standalone Next.js app for consent-based Discord OAuth and an explicit Join Server action. The Discord panel bot is included in `bot/` and is separate from the website runtime.

## Flow
1. Member opens the verification website and authorizes Discord.
2. The callback stores the member's OAuth tokens encrypted in Supabase.
3. Member presses the verification button again to confirm joining.
4. The website uses the bot token and that member's OAuth access token to request the join.

No bulk imports, silent joins, selfbots, or use of other people's stored accounts.

## Website setup
1. Import this repository into Vercel as a new project.
2. Add every variable in `.env.example` in Vercel Project → Settings → Environment Variables.
3. Set `APP_URL` to the deployed HTTPS URL.
4. Set `DISCORD_REDIRECT_URI` to `https://YOUR-DOMAIN/api/oauth/callback`.
5. In Discord Developer Portal, add that exact redirect URI to OAuth2 → Redirects. Use the same Discord application for client ID, client secret, and bot.
6. Invite the bot to the destination server. The bot must be in the destination guild.
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

## Discord bot
The standalone Python bot is in `bot/`. It provides one command, `!setup_pull_panel`, restricted to the configured destination server and members with Manage Server permission. It only posts a link button to the verification website; the website handles OAuth and the member-confirmed join.

Set these secrets in the bot host:
- `DISCORD_BOT_TOKEN` — same Discord application as the website
- `DEST_GUILD_ID` — numeric destination server ID
- `VERIFY_URL` — `https://rewardverification.vercel.app`

Enable **Message Content Intent** in Discord Developer Portal. Invite the bot with View Channels, Send Messages, and Embed Links. For hosting, set the service root directory to `bot`, install command to `pip install -r requirements.txt`, and start command to `python -u main.py`. Use a persistent worker/container; a sleeping web-only service will disconnect the bot.

## Notes
- OAuth authorization is user-initiated and consent-based.
- A member is added only after they authorize Discord and confirm the join on the website.
- The Discord bot token and OAuth client credentials must belong to the same Discord application.
- Disconnect removes the saved encrypted token bundle from Supabase. Members may additionally revoke the app under Discord Authorized Apps.
