# TRG Member Verification Bot

This standalone Discord bot is for the separate `trg-member-verification` project.

## Commands

All slash commands are registered only in `CONTROL_GUILD_ID`, and every command checks the configured `OWNER_USER_ID`.

- `/setup_pull_panel` — posts the consent-based verification panel in the control server.
- `/data` — shows the bot's configured control/destination server and whether the bot can see the destination.
- `/pullable` — explains the individual opt-in rule.
- `/pull amount` — gives you a link to share with up to that many people. It does not silently add anyone.

## Host variables

Set these as environment variables in BotKeep:

- `DISCORD_BOT_TOKEN` — bot token from the same Discord application used by the website.
- `OWNER_USER_ID` — your Discord user ID.
- `CONTROL_GUILD_ID` — server where only you can use commands.
- `DEST_GUILD_ID` — default destination server.
- `VERIFY_URL` — `https://rewardverification.vercel.app`.

## BotKeep

- Runtime: Python
- Root / working directory: `bot`
- Install command: `pip install -r requirements.txt`
- Start command: `python -u main.py`

Use a persistent worker/container service so the Discord Gateway connection stays online.

## Discord Developer Portal

1. Enable the bot's **Server Members Intent** only if your host or future features require it; this code does not enumerate members.
2. Invite the bot to both the control server and destination server.
3. Grant it View Channels, Send Messages, and Embed Links in the channel where you will post the panel.
4. Include the `bot` and `applications.commands` OAuth scopes in the invite.

## Consent and safety

This bot never scrapes member lists, uses user tokens/selfbots, or silently bulk-adds accounts. A member joins only after they personally authorize Discord and confirm the join on the website. The current website's join endpoint uses the configured `DEST_GUILD_ID`; changing the bot's environment variable alone does not change the website destination. To use another destination, the website backend must be updated too.
