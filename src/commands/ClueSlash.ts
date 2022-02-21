import { ButtonInteraction, CommandInteraction, EmbedFieldData, GuildMemberRoleManager, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User as DiscordUser } from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, On, ButtonComponent } from "discordx";
import { hiscores } from "runescape-api";
import { createUser, getUser, verifyUser } from "../backend/models/User.js";


@Discord()
export abstract class ClueSlash {
  @Slash('clue-title', { description: "Get your current clue rank" })
  async assignClueTitle(interaction: CommandInteraction) {
    const userResults = await getUser(interaction.member!.user.id)
    if (userResults.err || !userResults.result) {
      if (userResults.err instanceof Error && userResults.err.name == 'noUser') {
        const embed = new MessageEmbed({
          title: 'Current Rank', description: '❌ Error: No RSN Configured ❌ \n \n \
           Please use `/rank config` to configure your RSN.'  });
        interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      } else {
        const embed = new MessageEmbed({ title: 'Server Error', description: `❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n ${userResults.err}` });
        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      const userScore = await hiscores.getPlayer(userResults.result.rsn);
      if (userScore.activities) {
        const clues = [userScore.activities.clue_scrolls_easy, userScore.activities.clue_scrolls_medium,
        userScore.activities.clue_scrolls_hard, userScore.activities.clue_scrolls_elite, userScore.activities.clue_scrolls_master];
        let totalPoints = 0;
        let totalClues = 0;
        for (let i = 0; i < clues.length; i++) {
          if (clues[i].count !== -1) {
            let count = clues[i].count;
            totalPoints = totalPoints + Math.pow(2, i) * (
              (Math.floor(count / 500) * Math.pow(2, 5)) +
              (Math.floor(count / 250) - Math.floor(count / 500)) * Math.pow(2, 4) +
              (Math.floor(count / 100) - Math.floor(count / 500)) * Math.pow(2, 3) +
              (Math.floor(count / 50) - Math.floor(count / 100) - Math.floor(count / 250) + Math.floor(count / 500)) * Math.pow(2, 2) +
              (Math.floor(count / 10) - Math.floor(count / 50)) * Math.pow(2, 1) +
              (count - Math.floor(count / 10)) * Math.pow(2, 0)
            );
            totalClues = totalClues + count;
          }
        }

        const clueScrollResults = new MessageEmbed()
          .setTitle(`**Clue Stats for ${userResults.result.rsn}**`)
          .addField("Total", `Total Clue Points: ${totalPoints}\nTotalClues: ${totalClues}`)
          .addField("Masters", `Count: ${clues[4].count !== -1 ? clues[4].count : 0}, Rank: ${clues[4].rank !== -1 ? clues[4].rank : 0}`)
          .addField("Elites", `Count: ${clues[3].count !== -1 ? clues[3].count : 0}, Rank: ${clues[3].rank !== -1 ? clues[3].rank : 0}`)
          .addField("Hards", `Count: ${clues[2].count !== -1 ? clues[2].count : 0}, Rank: ${clues[2].rank !== -1 ? clues[2].rank : 0}`)
          .addField("Mediums", `Count: ${clues[1].count !== -1 ? clues[1].count : 0}, Rank: ${clues[1].rank !== -1 ? clues[1].rank : 0}`)
          .addField("Easies", `Count: ${clues[0].count !== -1 ? clues[0].count : 0}, Rank: ${clues[0].rank !== -1 ? clues[0].rank : 0}`)
        interaction.reply({ embeds: [clueScrollResults] });
      }
    }

  }

}