import { CommandInteraction, EmbedBuilder, Attachment, PermissionFlagsBits } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { removeOysterEntry } from '../backend/models/Oyster.js';

const adminBits = PermissionFlagsBits.KickMembers;

@Discord()
@SlashGroup({ name: 'mod', description: 'Commands for oyster competition', defaultMemberPermissions: adminBits })
export abstract class ClueSlash {
  numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  @Slash( { name: 'remove-oyster-entry', description: 'Remove invalid score' })
  @SlashGroup('mod')
  async removeInvalidScore(
    @SlashOption({
      description: 'Provide postion of the invalid entry',
      name: 'value',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
      value: string,
      interaction: CommandInteraction,
  ) {
    const convertValue = Number(value.replace(/,/g, ''));
    if (isNaN(convertValue)) {
      interaction.reply('Your value is not a number. Try again.');
    } 
    const response = await removeOysterEntry(convertValue);
    const oysterSubmission = new EmbedBuilder()
      .setTitle(`**Oyster Submission Removed by ${interaction.member!.user.username}**`)
      .addFields([{ name:'Value of Oyster', value:this.numberWithCommas(response.old_post.value), inline: true },
        { name:'Current position', value:'Removed', inline: true }])
      .setImage(response.old_post.picture)
      .setFooter({ text: 'Powered by Wizages' });
    interaction.reply({ embeds: [oysterSubmission] });
  }
}