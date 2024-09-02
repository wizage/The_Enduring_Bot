/* eslint-disable @typescript-eslint/no-shadow */
import { CommandInteraction, EmbedBuilder, StringSelectMenuBuilder, MessageActionRowComponentBuilder, 
  ActionRowBuilder, Message, TextChannel, ModalBuilder, TextInputStyle, TextInputBuilder, ModalSubmitInteraction, 
  StringSelectMenuInteraction, GuildMemberRoleManager, Role, ButtonBuilder, ButtonInteraction, SelectMenuComponentOptionData,
} from 'discord.js';
import { Discord, SelectMenuComponent, Slash, ModalComponent, SlashGroup, ButtonComponent  } from 'discordx';
import { Readable } from 'stream';
import { PVMCard, CluesCard, SkillingCard } from '../constants/cardimport.js';
import { getCard, insertDrop } from '../backend/models/Bingo.js';

const bingoCards = [
  { label: 'Skilling', value: 'Skilling' },
  { label: 'Clues', value: 'Clues' },
  { label: 'PVM', value: 'PVM' },
];

@Discord()

@SlashGroup({ name: 'bingo', description: 'Commands for submitting bingo things' })
export abstract class BingoClass {

  @ModalComponent()
  async signup(interaction: ModalSubmitInteraction): Promise<void> {

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

  @ButtonComponent({ id:/(drop-(approve|deny)*)\S+/ })
  async dropButtons(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    let currentRoles = (interaction.member!.roles as GuildMemberRoleManager).cache.filter((roleFilter: Role) => (roleFilter.name.includes('Council')));
    if (currentRoles.size === 0) {
      return interaction.followUp({ ephemeral: true, content:'You need to be an admin to approve drops' });
    }
    const parameters = interaction.customId.split('-');
    parameters.shift(); // Remove the first element
    // Parameters are now [approve/deny, card, location, droplocation, teamId]
    const syncedCard = await getCard(parameters[1], parameters[4]);
    const [x, y] = parameters[2].split('.').map((val) => parseInt(val));
    const itemLog = syncedCard?.card[x][y].value!;
    if (parameters[0] === 'approve') {
      if (itemLog[parseInt(parameters[3])] === 1) {
        return interaction.followUp({ ephemeral: true, content:'This drop has already been approved' });
      }
      insertDrop(parameters[1], parameters[4], [x, y], parseInt(parameters[3]), 1);
      const embedVerify = interaction.message.embeds[0];
      const newEmbed = EmbedBuilder.from(embedVerify).setDescription(`✅ Verified by <@${interaction.user.id}> ✅`);
      return interaction.editReply({ embeds: [newEmbed] });
    } else if (parameters[0] === 'deny') {
      const embedVerify = interaction.message.embeds[0];
      const newEmbed = EmbedBuilder.from(embedVerify).setDescription(`❌ Denied by <@${interaction.user.id}> ❌`);
      if (itemLog[parseInt(parameters[3])] === 1) {
        insertDrop(parameters[1], parameters[4], [x, y], parseInt(parameters[3]), 0);
      }
      return interaction.editReply({ embeds: [newEmbed] });
    }
  }

  @SelectMenuComponent({ id: 'cardselector' })
  async selectDrop(interaction: StringSelectMenuInteraction) : Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });
    let drops : SelectMenuComponentOptionData[] = [];
    if (interaction.values?.[0] === 'Skilling') {
      drops = Object.keys(SkillingCard.bingoCardBot).map((key) => {return { label: key, value: key };});
    } else if (interaction.values?.[0] === 'Clues') {
      drops = Object.keys(CluesCard.bingoCardBot).map((key) => {return { label: key, value: key };});
    } else if (interaction.values?.[0] === 'PVM') { 
      drops = Object.keys(PVMCard.bingoCardBot).map((key) => {return { label: key, value: key };});
    } else {
      return interaction.followUp({ ephemeral: true, content:'You need to select a valid bingo card' });
    } 
    
    const menu = new StringSelectMenuBuilder()
      .addOptions(drops)
      .setCustomId(`dropsubmission-${interaction.values?.[0]}`);
    const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
    
    interaction.editReply({ components: [buttonRow], content: 'Select your bingo card' });
    return;
  }

  @SelectMenuComponent({ id:/(dropsubmission-*)\w+/ })
  async submitDrop(interaction: StringSelectMenuInteraction) : Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });
    let currentCard;
    if (interaction.customId.includes('Skilling')) {
      currentCard = SkillingCard;
    } else if (interaction.customId.includes('Clues')) {
      currentCard = CluesCard;
    } else if (interaction.customId.includes('PVM')) {
      currentCard = PVMCard;
    } else {
      return interaction.followUp({ ephemeral: true, content:'You need to select a valid bingo card' });
    }
    const parameters = interaction.customId.split('-');
    parameters.shift(); // Remove the first element
    const dropId = interaction.values?.[0];
    if (currentCard.bingoCardBot[dropId!] && currentCard.bingoCardBot[dropId!].type && currentCard.bingoCardBot[dropId!].type === 'specific') {
      const buildCustomId = parameters.join('-');
      const menu = new StringSelectMenuBuilder()
        .addOptions(currentCard.bingoCardBot[dropId!].goal.map((key) => {return { label: key.name, value: key.name };}))
        .setCustomId(`dropsubmission-${buildCustomId}-${dropId}`);
      
      const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
      interaction.editReply({ components: [buttonRow], content: 'Select your specific drop' });
      return;
    } else if (currentCard.bingoCardBot[dropId!] && currentCard.bingoCardBot[dropId!].type && currentCard.bingoCardBot[dropId!].type === 'number') {
      const buildCustomId = parameters.join('-');
      const goalMap = Array(currentCard.bingoCardBot[dropId!].goal).fill(null);
      const menu = new StringSelectMenuBuilder()
        .addOptions(goalMap.map((key, index) => {return { label: `${currentCard.bingoCardBot[dropId!].desc}${index + 1}`, value: `${index}` };}))
        .setCustomId(`dropsubmission-${buildCustomId}-${dropId}`);
      
      const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
      interaction.editReply({ components: [buttonRow], content: 'Select your specific drop' });
      return;
    }

    let locationBingo = [];
    if (parameters.length >= 2) {
      locationBingo = currentCard.bingoCardBot[parameters[1]].location;
    } else {
      locationBingo = currentCard.bingoCardBot[dropId].location;
    }

    let currentRoles = (interaction.member!.roles as GuildMemberRoleManager).cache.filter((roleFilter: Role) => (roleFilter.name.includes('Team')));
    if (currentRoles.size === 0) {
      return interaction.followUp({ ephemeral: true, content:'You need to sign up for bingo first, and have a team. If you have a team please ping <@409181714821283840>' });
    }

    const syncedCard = await getCard(parameters[0], currentRoles.first()?.id!);
    const itemLog = syncedCard?.card[locationBingo[0]][locationBingo[1]].value!;
    let dropLocation = 0;
    if (parameters.length >= 2) {
      if (currentCard.bingoCardBot[parameters[1]].type === 'specific') {
        dropLocation = currentCard.bingoCardBot[parameters[1]].goal.findIndex((goal) => goal.name === dropId);
      } else {
        dropLocation = parseInt(dropId!);
      }
      if (itemLog[dropLocation] === 1) {
        return interaction.followUp({ ephemeral: true, content:'You have already submitted this drop' });
      }
    } else {
      if (currentCard.bingoCardBot[dropId!].type === 'single') {
        if (itemLog[dropLocation] === 1) {
          return interaction.followUp({ ephemeral: true, content:'You have already submitted this drop' });
        }
      }
    }
    let dropName = '';
    if (parameters.length >= 2 && currentCard.bingoCardBot[parameters[1]].type === 'number') {
      dropName = `${currentCard.bingoCardBot[parameters[1]].desc}${parseInt(dropId) + 1}`;
      interaction.followUp({ ephemeral: true, content:`Please upload a drop for: ${dropName}` });
    } else {
      dropName = dropId!;
      interaction.followUp({ ephemeral: true, content:`Please upload a drop for: ${dropName}` });
    } 
    interaction.channel?.awaitMessages({ max: 1, time: 60000, errors: ['time'], filter:(response:Message)=>{ return response.author.id === interaction.user.id && response.attachments.size > 0;} }).then(collected => {
      let channelId = '';
      if (interaction.guildId === '932144876659822623') {
        channelId = '1274111586369540192';
      } else if (interaction.guildId === '198166521573408768') {
        channelId = '1274120845572309093';
      }
      let bingoLog = interaction.client.channels.cache.get(channelId) as TextChannel;

      const buildDropString = parameters.join(' > ');
      
      fetch(collected.first()?.attachments.first()!.proxyURL!).then(response => {return response.body;}).then(async body => {
        const stream = Readable.from(body!);
        const logger = await bingoLog.send({ files: [{ attachment: stream, name: collected.first()?.attachments.first()!.name }] });
        const submitted = new EmbedBuilder()
          .setTitle('**Submitted Drop**') 
          .addFields([
            { name:'__Drop submitted__', value:`${buildDropString} > ${dropName}` },
            { name:'__Submitted by__', value:`<@${interaction.user.id}>`, inline: true },
            { name:'__Team__', value:`<@&${currentRoles.first()?.id}>`, inline: true }])
          .setImage(logger.attachments.first()!.proxyURL);

        setTimeout((collected)=>{collected.first()?.delete();}, 1000, collected);
        const buildCustomId = `${parameters[0]}-${locationBingo.join('.')}-${dropLocation}`;
        const adminButtons = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`drop-approve-${buildCustomId}-${currentRoles.first()?.id}`)
            .setLabel('Validate')
            .setStyle(3),
          new ButtonBuilder()
            .setCustomId(`drop-deny-${buildCustomId}-${currentRoles.first()?.id}`)
            .setLabel('Deny')
            .setStyle(4),
        );
        return interaction.followUp({ embeds:[submitted], components: [adminButtons] });
      });
    }).catch((e) => {
      console.log(e);
      return interaction.followUp('You did not submit a bingo photo in time');
    });
    return interaction;
  }
  
  @Slash( { name: 'submit', description: 'Submit your bingo drop' })
  @SlashGroup('bingo')
  async submitBingo(interaction: CommandInteraction): Promise<unknown> {
    if (interaction.guildId === '198166521573408768') {
      return interaction.reply({ content: 'This command is disabled in this server', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });

    const menu = new StringSelectMenuBuilder()
      .addOptions(bingoCards)
      .setCustomId('cardselector');
      
    const buttonRow = 
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(menu);
    
    interaction.editReply({ components: [buttonRow], content: 'Select your bingo card' });
    return;
  }

  @Slash( { name: 'signup', description: 'Sign up for bingo' })
  @SlashGroup('bingo')
  signupBingo(
    interaction: CommandInteraction): void {

    if (interaction.guildId === '198166521573408768' && interaction.channelId !== '1275969956663787652') {
      interaction.reply({ content: 'This command is disabled all channels but <#1275969956663787652>', ephemeral: true });
      return;
    }

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