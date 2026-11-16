import discord
from discord.ext import commands


def setup_member_pull_panel(bot: commands.Bot, verify_url: str) -> None:
    """Register !setup_pull_panel on the existing bot.

    This module only posts a link to the separate verification website. It does
    not read member tokens, perform OAuth, or add members itself.
    """

    class MemberVerificationView(discord.ui.View):
        def __init__(self):
            super().__init__(timeout=None)
            self.add_item(
                discord.ui.Button(
                    label="Verify & Join Server",
                    style=discord.ButtonStyle.link,
                    url=verify_url,
                    emoji="🔐",
                )
            )

    @bot.command(name="setup_pull_panel")
    @commands.has_permissions(manage_guild=True)
    async def setup_pull_panel(ctx: commands.Context):
        embed = discord.Embed(
            title="🔐 Server Member Verification",
            description=(
                "Want to join our community?\n\n"
                "1. Press **Verify & Join Server** below.\n"
                "2. Sign in to Discord and review the requested permission.\n"
                "3. After connecting, press **Join Discord Server** on the website.\n\n"
                "You stay in control. The server is only joined after you confirm."
            ),
            color=discord.Color.gold(),
        )
        embed.set_footer(text="TRG Community • Secure Discord OAuth")
        await ctx.send(embed=embed, view=MemberVerificationView())

    @setup_pull_panel.error
    async def setup_pull_panel_error(ctx: commands.Context, error: commands.CommandError):
        if isinstance(error, commands.MissingPermissions):
            await ctx.reply("You need **Manage Server** permission to post this panel.", mention_author=False)
        else:
            raise error
