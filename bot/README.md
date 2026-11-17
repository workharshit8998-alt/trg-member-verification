# TRG Member Verification Bot

This is the small Discord panel bot for the separate `trg-member-verification` website.

## What it does

- Connects as a normal Discord bot account.
- Exposes one prefix command: `!setup_pull_panel`.
- Only allows the command in the configured `DEST_GUILD_ID`.
- Requires the caller to have **Manage Server** permission.
- Posts a button linking to `https://rewardverification.vercel.app`.

The bot does **not** scrape members, import member lists, use user tokens, or silently add anyone. The website handles OAuth, and the member must explicitly authorize Discord and confirm the join on the website.

## Host environment variables

Set these in your bot host's secret/environment-variable panel. Do not commit real values.

- `DISCORD_BOT_TOKEN`: token from the same Discord application used by the website.
- `DEST_GUILD_ID`: numeric ID of the one destination server.
- `VERIFY_URL`: `https://rewardverification.vercel.app`

## Discord Developer Portal

1. Open the same application used by the website.
2. In Bot, reset/copy the bot token and store it only as the host secret `DISCORD_BOT_TOKEN`.
3. Enable **Message Content Intent** because this bot uses the `!` prefix command.
4. Invite the bot to the destination server with **View Channels**, **Send Messages**, and **Embed Links**.
5. Keep the bot in that destination server.

## Run

From this folder:

```bash
pip install -r requirements.txt
python main.py
```

Then run `!setup_pull_panel` in the destination server as a member with Manage Server permission.

## Hosting

Set the service's working/root directory to `bot`, install command to `pip install -r requirements.txt`, and start command to `python -u main.py`. Use a persistent worker/container service; a sleeping web-only service will disconnect a Gateway bot.
