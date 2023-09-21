import { CommandInteraction, EmbedBuilder, Attachment, TextChannel } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';

@Discord()
@SlashGroup({ name: 'fashion', description: 'Commands for fashion show competition' })
export abstract class FashionSlash {

  @Slash( { name: 'submit', description: 'Submit your fashion' })
  @SlashGroup('fashion')
  async submitOyster(
    @SlashOption({
      description: 'Provide your in-game name',
      name: 'username',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
      username: string,
    @SlashOption({
      description: 'image',
      name: 'image',
      required: true,
      type: ApplicationCommandOptionType.Attachment,
    })
      attachment: Attachment,
    @SlashOption({
      description: '(Optional) Provide a title for your outfit',
      name: 'title',
      required: false,
      type: ApplicationCommandOptionType.String,
    })
      fashionTitle: string,
      interaction: CommandInteraction) {
      
      const success = new EmbedBuilder().setTitle('Successfully submitted!').setImage(`attachment://${attachment.name}`);
      const publicChannel = interaction.channel as TextChannel;
      const ownerSubmission = new EmbedBuilder()
        .setTitle(`**Fashion show submission for ${interaction.member!.user.username}**`)
        .addFields([{ name:'In-game name', value:username, inline: true }, {name: 'Title', value:fashionTitle?fashionTitle:'N/A'}])
        .setImage(`attachment://${attachment.name}`)
        .setFooter({ text: 'Powered by Wizages' });
      const publicSubmission = new EmbedBuilder()
        .setTitle(`**Fashion show submission**`)
        .addFields([{name: 'Title', value:fashionTitle?fashionTitle:'N/A'}])
        .setImage(`attachment://${attachment.name}`)
        .setFooter({ text: 'Powered by Wizages' });
      
      let ownerChannelId = '';
        if (interaction.guildId === '932144876659822623') {
          ownerChannelId = '1153754882008952883'; //test server
        } else if (interaction.guildId === '198166521573408768') {
          ownerChannelId = '1022554962439450674'; //tbd
        }
      let ownerSubmissionChannel = interaction.client.channels.cache.get(ownerChannelId) as TextChannel;
      ownerSubmissionChannel.send({ embeds: [ownerSubmission], files:[attachment] });
      publicChannel.send({ embeds: [publicSubmission], files:[attachment] });
      await interaction.reply({ embeds: [success], ephemeral:true });

  }
}