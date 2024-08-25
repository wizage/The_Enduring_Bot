/* eslint-disable @typescript-eslint/no-shadow */
import { CommandInteraction, EmbedBuilder, StringSelectMenuBuilder, MessageActionRowComponentBuilder, 
  ActionRowBuilder, Message, TextChannel, ModalBuilder, TextInputStyle, TextInputBuilder, ModalSubmitInteraction, 
  StringSelectMenuInteraction} from 'discord.js';
import { Discord, SelectMenuComponent, Slash, ModalComponent, SlashGroup  } from 'discordx';
import { Readable } from 'stream';
import bingoCard from '../constants/card1.json' assert {type: 'json'};

const bingoCards = [
  { label: 'Card 1', value: 'card1' },
  { label: 'Card 2', value: 'card2' },
  { label: 'Card 3', value: 'card3' },
];

@Discord()

@SlashGroup({ name: 'bingo', description: 'Commands for submitting bingo things' })
export abstract class BingoClass {

  @ModalComponent()
  async signup(interaction: ModalSubmitInteraction): Promise<void> {
    if (interaction.guildId === '198166521573408768' && interaction.channelId !== '1275969956663787652') {
      interaction.reply({ content: 'This command is disabled all channels but <#1275969956663787652>', ephemeral: true });
      return;
    }

    const [rsn, lvl, timezone, clueCount, favoriteBoss] = ['rsn', 'lvl', 'timezone', 'clueCount', 'favoriteBoss'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );

    const signup = new EmbedBuilder()
      .setTitle('**Signup Form**') 
      .addFields([
        { name:'__RSN__', value:`${rsn}`, inline: true },
        { name:'__Discord Username__', value:`<@${interaction.user.id}>`, inline: true },
        { name:'__Total Level__', value:`${lvl}`, inline: true },
        { name:'__Timezone__', value:`${timezone}`, inline: true },
        { name:'__Clue Count__', value:`${clueCount}`, inline: true },
        { name:'__Favorite Bosses:__', value:`${favoriteBoss}` },
      ]);

    await interaction.reply({ embeds:[signup] });

    if (interaction.guildId === '932144876659822623') { 
      let guild = await interaction.guild?.fetch();
      const member = await guild!.members.fetch(interaction.user.id);
      const role = await guild?.roles.fetch('1277132933123280947');
      member.roles.add(role!);
    } else if (interaction.guildId === '198166521573408768') { //enduring
      let guild = await interaction.guild?.fetch();
      const member = await guild!.members.fetch(interaction.user.id);
      const role = await guild?.roles.fetch('1007735894452731954');
      member.roles.add(role!);
    }

    

    const signupDM = new EmbedBuilder()
      .setTitle('**Bingo Signup Confirmation**') 
      .setDescription('Thank you for signing up for bingo! If you have any issues during the bingo or you want to join a specific team member, please ping <@409181714821283840>. Look forward to seeing you on <t:1725926400:F>.')
      .setColor('#2fc991')
      .setFooter({ text: 'Please do not reply to this message' });

    await interaction.user.send({ embeds:[signupDM] });
    
    return;
  }

  @SelectMenuComponent({ id: 'dropselector' })
  async selectDrop(interaction: CommandInteraction) : Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });

    // const cardId = interaction.values?.[0] as string;
    const drops = Object.keys(bingoCard.bingoCardBot).map((key) => {return { label: key, value: key };});

    const menu = new StringSelectMenuBuilder()
      .addOptions(drops)
      .setCustomId('dropsubmission');
      
    const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
    
    interaction.editReply({ components: [buttonRow], content: 'Select your bingo card' });
    return;

  }

  @SelectMenuComponent({ id: 'dropsubmission' })
  async submitDrop(interaction: StringSelectMenuInteraction) : Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });

    const dropId = interaction.values?.[0];
    if (!bingoCard.bingoCardBot[dropId!]) {
      
    } else {
      if (bingoCard.bingoCardBot[dropId!].type && bingoCard.bingoCardBot[dropId!].type === 'specific') {
        const menu = new StringSelectMenuBuilder()
          .addOptions(bingoCard.bingoCardBot[dropId!].goal.map((key) => {return { label: key.name, value: key.name };}))
          .setCustomId('dropsubmission');
        
        const buttonRow = 
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
      
        interaction.editReply({ components: [buttonRow], content: 'Select your specific drop' });
        return;
      }
    }

    interaction.followUp({ ephemeral: true, content:`Please upload a drop for: ${dropId}` });
    interaction.channel?.awaitMessages({ max: 1, time: 60000, errors: ['time'], filter:(response:Message)=>{ return response.author.id === interaction.user.id && response.attachments.size > 0;} }).then(collected => {
      let channelId = '';
      if (interaction.guildId === '932144876659822623') {
        channelId = '1274111586369540192';
      } else if (interaction.guildId === '198166521573408768') {
        channelId = '1274120845572309093';
      }
      let bingoLog = interaction.client.channels.cache.get(channelId) as TextChannel;
      
      fetch(collected.first()?.attachments.first()!.proxyURL!).then(response => {return response.body;}).then(async body => {
        const stream = Readable.from(body!);
        const logger = await bingoLog.send({ files: [{ attachment: stream, name: collected.first()?.attachments.first()!.name }] });
        const submitted = new EmbedBuilder()
          .setTitle('**Submitted Drop**') 
          .addFields([{ name:'__Drop submitted__', value:`${dropId}` }])
          .setImage(logger.attachments.first()!.proxyURL);

        setTimeout((collected)=>{collected.first()?.delete();}, 1000, collected);
        return interaction.followUp({ embeds:[submitted] });
      });
    }).catch(() => {
      return interaction.followUp('You did not submit a bingo photo in time');
    });
    return interaction;
  }
  
  @Slash( { name: 'submit', description: 'Submit your bingo drop' })
  @SlashGroup('bingo')
  async submitClue(interaction: CommandInteraction): Promise<unknown> {
    if (interaction.guildId === '198166521573408768') {
      return interaction.reply({ content: 'This command is disabled in this server', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const menu = new StringSelectMenuBuilder()
      .addOptions(bingoCards)
      .setCustomId('dropselector');
      
    const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
    
    interaction.editReply({ components: [buttonRow], content: 'Select your bingo card' });
    return;
  }

  @Slash( { name: 'signup', description: 'Sign up for bingo' })
  @SlashGroup('bingo')
  signupClue(
    interaction: CommandInteraction): void {

    const modal = new ModalBuilder()
      .setTitle('Bingo Signup')
      .setCustomId('signup');
    const rsnIC = new TextInputBuilder()
      .setCustomId('rsn')
      .setLabel('Runescape Username')
      .setStyle(TextInputStyle.Short);
    const lvlIC = new TextInputBuilder()
      .setCustomId('lvl')
      .setLabel('Total Level')
      .setStyle(TextInputStyle.Short);
    const tzIC = new TextInputBuilder()
      .setCustomId('timezone')
      .setLabel('Timezone, e.g. EST')
      .setStyle(TextInputStyle.Short);
    const clueIC = new TextInputBuilder()
      .setCustomId('clueCount')
      .setLabel('Total Clue Count')
      .setStyle(TextInputStyle.Short);

    const bossIC = new TextInputBuilder()
      .setCustomId('favoriteBoss')
      .setLabel('Favorite Bosses:')
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      rsnIC,
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      lvlIC,
    );

    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      tzIC,
    );
    const row4 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      clueIC,
    );

    const row5 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      bossIC,
    );

    modal.addComponents(row1, row2, row3, row4, row5);

    interaction.showModal(modal);
  }
}