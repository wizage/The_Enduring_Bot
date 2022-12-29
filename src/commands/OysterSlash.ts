import { ButtonInteraction, CommandInteraction, GuildMemberRoleManager, Message, EmbedBuilder, TextChannel, User as DiscordUser } from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, On, ButtonComponent } from "discordx";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { hiscores } from "runescape-api";
import { getHiscores } from "../backend/models/Oyster.js";


@Discord()
export abstract class OysterSlash {
  @Slash( { name: 'oyster', description: 'Submit your value' })
  async assignClueTitle(
  @SlashOption({
      description: "Provide your oyster value",
      name: "value",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
  value: string,
  interaction: CommandInteraction) {
    // if (!username){
    //   const userResults = await getUser(interaction.member!.user.id)
    //   if (userResults.err || !userResults.result) {
    //     if (userResults.err instanceof Error && userResults.err.name == 'noUser') {
    //       const embed = new EmbedBuilder({
    //         title: 'Current Rank', description: '❌ Error: No RSN Configured ❌ \n \n \
    //          Please use `/rank config` to configure your RSN.'  });
    //       interaction.reply({ embeds: [embed], ephemeral: true });
    //       return;
    //     } else {
    //       const embed = new EmbedBuilder({ title: 'Server Error', description: `❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n ${userResults.err}` });
    //       interaction.reply({ embeds: [embed], ephemeral: true });
    //       return;
    //     }
    //   }
    //   username = userResults.result.rsn;
    // }
    const submissionId = interaction.member!.user.id

    // getHiscores();
    interaction.reply("Provide a screenshot with the code: @");
    
  }
}