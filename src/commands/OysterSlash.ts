import { CommandInteraction, EmbedBuilder, Attachment } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup } from 'discordx';
import { Pagination, PaginationItem, PaginationType } from '@discordx/pagination';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { addEntry, getHiscores } from '../backend/models/Oyster.js';

@Discord()
@SlashGroup({ name: 'oyster', description: 'Commands for oyster competition' })
export abstract class OysterSlash {
  numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  @Slash( { name: 'submit', description: 'Submit your value' })
  @SlashGroup('oyster')
  async submitOyster(
  @SlashOption({
    description: 'Provide your oyster value',
    name: 'value',
    required: true,
    type: ApplicationCommandOptionType.String,
  })
    value: string,
    @SlashOption({
      description: 'image',
      name: 'image',
      required: true,
      type: ApplicationCommandOptionType.Attachment,
    })
    attachment: Attachment,
    interaction: CommandInteraction) {
    const convertValue = Number(value.replace(/,/g, ''));
    if (isNaN(convertValue)) {
      interaction.reply('Your value is not a number. Try again.');
    } else {
      const results = await addEntry({ value: convertValue,  discordId:interaction.member!.user.id, picture: attachment.url, discordName:interaction.member!.user.username });

      if (results.err) {
        interaction.reply('Error has occured... Please ping Wizages');
      } else {
        const oysterSubmission = new EmbedBuilder()
          .setTitle(`**Oyster Submission for ${interaction.member!.user.username}**`)
          .addFields([{ name:'Value of Oyster', value:this.numberWithCommas(convertValue), inline: true },
            { name:'Current position', value:`${results.position}`, inline: true }])
          .setImage(`attachment://${attachment.name}`)
          .setFooter({ text: 'Powered by Wizages' });
        interaction.reply({ embeds: [oysterSubmission], files: [attachment] });
      }
    }
  }

  @Slash( { name: 'hiscore', description: 'Hiscore list for this month' })
  @SlashGroup('oyster')
  async getHiscoresOyster(
    interaction: CommandInteraction,
  ) {
    const hiscores = await getHiscores();
    if (hiscores.length > 0) {
      const pages = hiscores.map((submission, i) => {
        const embeder = new EmbedBuilder()
          .setFooter({ text: `Page ${i + 1} of ${hiscores.length}` })
          .setTitle('**Oyster Competition**')
          .addFields([{ name:'Value of Oyster', value:this.numberWithCommas(submission.value), inline: true },
            { name:'Current position', value:`${i + 1}`, inline: true }, { name:'Username', value:`<@${submission.discordId}>`, inline: true }])
          .setImage(submission.picture);
        const page : PaginationItem = {
          embeds: [embeder],
        };
        return page;
      });

      const pagination = new Pagination(interaction, pages, { type: PaginationType.Button, ephemeral: true, time: 600000 });
      await pagination.send();
    } else {
      let noneofthat = new EmbedBuilder()
        .setTitle('**Oyster Competition**')
        .setDescription('No one has submitted anything...');
      interaction.reply({ embeds: [noneofthat], ephemeral: true });
    }
  }
}

