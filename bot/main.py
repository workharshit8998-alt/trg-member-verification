import logging
import os

import discord
from discord import app_commands
from discord.ext import commands

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
log = logging.getLogger("trg-member-verification")


def env_int(name: str, fallback: int) -> int:
    """Read a numeric ID from the host; use this project's fixed safe default if absent."""
    raw = os.getenv(name, "").strip().strip('"').strip("'")
    if not raw:
        log.warning("%s is not exposed by the host; using the configured project default.", name)
        return fallback
    if not raw.isdigit():
        raise RuntimeError(f"{name} must contain digits only; received an invalid value.")
    return int(raw)


TOKEN = os.getenv("DISCORD_BOT_TOKEN", "").strip().strip('"').strip("'")
# Defaults keep the bot bootable on hosts that fail to inject Startup variables.
# These are still overridable from BotKeep.
OWNER_USER_ID = env_int("OWNER_USER_ID", 1326234591979376771)
CONTROL_GUILD_ID = env_int("CONTROL_GUILD_ID", 1504338538790125700)
DEST_GUILD_ID = env_int("DEST_GUILD_ID", 1464888284583825501)
VERIFY_URL = os.getenv(
    "VERIFY_URL", "https://rewardverification.vercel.app"
).strip().rstrip("/")

if not TOKEN:
    raise RuntimeError("Missing DISCORD_BOT_TOKEN.")
if not VERIFY_URL.startswith("https://"):
    raise RuntimeError("VERIFY_URL must start with https://")

CONTROL_GUILD = discord.Object(id=CONTROL_GUILD_ID)
DEST_GUILD = discord.Object(id=DEST_GUILD_ID)

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)


def owner_only(interaction: discord.Interaction) -> bool:
    return interaction.user.id == OWNER_USER_ID


def control_server_only(interaction: discord.Interaction) -> bool:
    return interaction.guild_id == CONTROL_GUILD_ID


def authorized(interaction: discord.Interaction) -> bool:
    return owner_only(interaction) and control_server_only(interaction)


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


_commands_synced = False


@bot.event
async def on_ready() -> None:
    global _commands_synced
    log.info("Logged in as %s (%s)", bot.user, bot.user.id if bot.user else "?")
    log.info("Control server: %s | Default destination: %s", CONTROL_GUILD_ID, DEST_GUILD_ID)
    if not _commands_synced:
        synced = await bot.tree.sync(guild=CONTROL_GUILD)
        _commands_synced = True
        log.info("Synced %s slash commands to control server %s", len(synced), CONTROL_GUILD_ID)


@bot.tree.command(
    name="setup_pull_panel",
    description="Post the member-consent verification panel",
    guild=CONTROL_GUILD,
)
async def setup_pull_panel(interaction: discord.Interaction) -> None:
    if not authorized(interaction):
        await interaction.response.send_message(
            "You are not allowed to use this command here.", ephemeral=True
        )
        return

    embed = discord.Embed(
        title="🔐 Server Member Verification",
        description=(
            "Want to join the community?\n\n"
            "1. Press **Verify & Join Server** below.\n"
            "2. Sign in to Discord and review the requested permissions.\n"
            "3. After connecting, press **Verify Now** again to confirm joining.\n\n"
            "Your account is added only after you authorize Discord and confirm the join."
        ),
        color=discord.Color.from_rgb(112, 76, 230),
    )
    embed.add_field(
        name="Default destination",
        value=f"[Configured server](https://discord.com/channels/{DEST_GUILD_ID})",
        inline=False,
    )
    embed.set_footer(text="TRG Member Verification • Consent-based OAuth")
    await interaction.response.send_message(
        "Panel posted.", ephemeral=True
    )
    await interaction.channel.send(embed=embed, view=VerificationPanel())


@bot.tree.command(
    name="data",
    description="Show bot and server configuration status",
    guild=CONTROL_GUILD,
)
async def data(interaction: discord.Interaction) -> None:
    if not authorized(interaction):
        await interaction.response.send_message(
            "You are not allowed to use this command here.", ephemeral=True
        )
        return

    dest = bot.get_guild(DEST_GUILD_ID)
    destination_status = (
        f"Connected: **Yes** • Members: **{dest.member_count or 'unknown'}**"
        if dest
        else "Connected: **No** — invite the bot to the destination server."
    )
    embed = discord.Embed(title="Bot Configuration", color=discord.Color.blurple())
    embed.add_field(name="Control server", value=str(CONTROL_GUILD_ID), inline=False)
    embed.add_field(name="Default destination", value=str(DEST_GUILD_ID), inline=False)
    embed.add_field(name="Destination bot access", value=destination_status, inline=False)
    embed.add_field(name="Verification website", value=VERIFY_URL, inline=False)
    await interaction.response.send_message(embed=embed, ephemeral=True)


@bot.tree.command(
    name="pullable",
    description="Explain which members can be added through verification",
    guild=CONTROL_GUILD,
)
async def pullable(interaction: discord.Interaction) -> None:
    if not authorized(interaction):
        await interaction.response.send_message(
            "You are not allowed to use this command here.", ephemeral=True
        )
        return

    await interaction.response.send_message(
        "Members are not bulk-imported or silently added. A person becomes a member "
        "only after they personally authorize Discord on the verification website "
        "and press the final **Verify Now** button. Ask them to use the panel; "
        "the website completes their individual join.",
        ephemeral=True,
    )


@bot.tree.command(
    name="pull",
    description="Show the consent-based joining instructions",
    guild=CONTROL_GUILD,
)
@app_commands.describe(amount="Number of people you want to invite to verify")
async def pull(interaction: discord.Interaction, amount: app_commands.Range[int, 1, 1000]) -> None:
    if not authorized(interaction):
        await interaction.response.send_message(
            "You are not allowed to use this command here.", ephemeral=True
        )
        return

    await interaction.response.send_message(
        f"To invite up to **{amount}** people, share the verification panel link: "
        f"{VERIFY_URL}\n\nEach person must authorize Discord and confirm their own "
        "join. This command does not force-add or mass-join accounts.",
        ephemeral=True,
    )


@bot.tree.error
async def on_app_command_error(
    interaction: discord.Interaction, error: app_commands.AppCommandError
) -> None:
    log.error("Slash command error: %s", error)
    message = "Something went wrong. Check the bot host logs."
    if interaction.response.is_done():
        await interaction.followup.send(message, ephemeral=True)
    else:
        await interaction.response.send_message(message, ephemeral=True)


bot.run(TOKEN)
