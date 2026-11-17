import os
import logging

import discord
from discord.ext import commands

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("trg-member-verification")

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip()
VERIFY_URL = os.getenv("VERIFY_URL", "https://rewardverification.vercel.app").strip()
DEST_GUILD_ID_RAW = os.getenv("DEST_GUILD_ID", "").strip()

if not TOKEN:
    raise RuntimeError("Missing DISCORD_BOT_TOKEN environment variable.")
if not DEST_GUILD_ID_RAW.isdigit():
    raise RuntimeError("DEST_GUILD_ID must be the numeric ID of the destination Discord server.")
if not VERIFY_URL.startswith("https://"):
    raise RuntimeError("VERIFY_URL must be an HTTPS URL.")

DEST_GUILD_ID = int(DEST_GUILD_ID_RAW)

intents = discord.Intents.default()
intents.guilds = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents, help_command=None)


class VerificationPanel(discord.ui.View):
    def __init__(self) -> None:
        super().__init__(timeout=None)
        self.add_item(
            discord.ui.Button(
                label="Verify & Join Server",
                style=discord.ButtonStyle.link,
                url=VERIFY_URL,
                emoji="🔐",
            )
        )


@bot.event
async def on_ready() -> None:
    log.info("Logged in as %s (%s)", bot.user, bot.user.id if bot.user else "unknown")
    log.info("Restricted destination server: %s", DEST_GUILD_ID)


@bot.command(name="setup_pull_panel")
@commands.guild_only()
@commands.has_guild_permissions(manage_guild=True)
async def setup_pull_panel(ctx: commands.Context) -> None:
    if ctx.guild is None or ctx.guild.id != DEST_GUILD_ID:
        await ctx.reply(
            "This command is only enabled in the configured destination server.",
            mention_author=False,
        )
        return

    embed = discord.Embed(
        title="🔐 Server Member Verification",
        description=(
            "Ready to join the community?\n\n"
            "1. Press **Verify & Join Server** below.\n"
            "2. Sign in to Discord and review the requested access.\n"
            "3. On the website, press **Verify Now** again to confirm joining.\n\n"
            "Your account is added only after you authorize Discord and confirm the join."
        ),
        color=discord.Color.from_rgb(112, 76, 230),
    )
    embed.set_footer(text="TRG Community • Discord OAuth verification")

    await ctx.send(embed=embed, view=VerificationPanel())


@setup_pull_panel.error
async def setup_pull_panel_error(
    ctx: commands.Context, error: commands.CommandError
) -> None:
    if isinstance(error, commands.NoPrivateMessage):
        return
    if isinstance(error, commands.MissingPermissions):
        await ctx.reply(
            "You need the **Manage Server** permission to post the verification panel.",
            mention_author=False,
        )
        return
    log.warning("Command error: %s", error)
    await ctx.reply("The panel could not be posted. Check the bot logs.", mention_author=False)


@bot.event
async def on_command_error(
    ctx: commands.Context, error: commands.CommandError
) -> None:
    if isinstance(error, commands.CommandNotFound):
        return
    if isinstance(error, commands.CheckFailure):
        return
    log.exception("Unhandled command error", exc_info=error)


bot.run(TOKEN)
