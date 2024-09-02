import { ChannelType, CommandInteraction, PermissionFlagsBits, PermissionsBitField, Role } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { setupTeam } from '../backend/models/Bingo.js';
import { BingoCard, BingoItem, BingoRow } from '../types/Bingo';
import { PVMCard, CluesCard, SkillingCard } from '../constants/cardimport.js';

const adminBits = PermissionFlagsBits.KickMembers;

@Discord()
@SlashGroup({ name: 'mod', description: 'Commands for oyster competition', defaultMemberPermissions: adminBits })
export abstract class ClueSlash {
  numberWithCommas(x: number) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // @Slash( { name: 'remove-oyster-entry', description: 'Remove invalid score' })
  // @SlashGroup('mod')
  // async removeInvalidScore(
  //   @SlashOption({
  //     description: 'Provide postion of the invalid entry',
  //     name: 'value',
  //     required: true,
  //     type: ApplicationCommandOptionType.String,
  //   })
  //   value: string,
  //   interaction: CommandInteraction,
  // ) {
  //   const convertValue = Number(value.replace(/,/g, ''));
  //   if (isNaN(convertValue)) {
  //     interaction.reply('Your value is not a number. Try again.');
  //   } 
  //   const response = await removeOysterEntry(convertValue);
  //   const oysterSubmission = new EmbedBuilder()
  //     .setTitle(`**Oyster Submission Removed by ${interaction.member!.user.username}**`)
  //     .addFields([{ name:'Value of Oyster', value:this.numberWithCommas(response.oldPost.value), inline: true },
  //       { name:'Current position', value:'Removed', inline: true }])
  //     .setImage(response.oldPost.picture)
  //     .setFooter({ text: 'Powered by Wizages' });
  //   interaction.reply({ embeds: [oysterSubmission] });
  // }

  private convertCard = (card: any, teamId:string, cardId:string): BingoCard => {

    const size = card.settings.bingoSize;
    const ddbCard = Array(size).fill(null).map(() => Array(size).fill(null));
    Object.keys(card.bingoCardBot).forEach((item) => {
      const [x, y] = card.bingoCardBot[item].location;
      let value;
      if (card.bingoCardBot[item].type === 'single') {
        value = ['0'];
      } else if (card.bingoCardBot[item].type === 'number') {
        value = Array(card.bingoCardBot[item].goal).fill('0');
      } else if (card.bingoCardBot[item].type === 'specific') {
        value = Array(card.bingoCardBot[item].goal.length).fill('0');
      }
      const bingoItem : BingoItem = { dropid: item, value: value };
      ddbCard[x][y] = bingoItem;
    });

    const bingoCard: BingoCard = {
      teamid: teamId,
      cardid: cardId,
      card: ddbCard as unknown as BingoRow[], //Ignore crappy programming
    };
    return bingoCard;
  };

  @Slash({ name:'setup-bingo-team', description: 'Setup a new bingo team' })
  @SlashGroup('mod')
  async setupBingoTeam(
    @SlashOption({
      description: 'Provide the team name',
      name: 'teamname',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    teamname: string,
    @SlashOption({
      description: 'Provide the team members',
      name: 'members',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    members: string,
    interaction: CommandInteraction,
  ) {
    interaction.deferReply();
    const teamMembers = members.split(' ');

    let guild = await interaction.guild?.fetch();

    let role = guild?.roles.cache.find( (r: Role) => r.name == `Team ${teamname}`);
    if (!role) {
      await guild?.roles.create({
        name: `Team ${teamname}`,
        mentionable: true,

      });
      role = guild?.roles.cache.find((r: Role) => r.name == `Team ${teamname}`);
    }

    const discordSafe = teamname.replace(' ', '-').toLowerCase();
    teamMembers.forEach(async (member) => {
      let memberId = member.replace(/[<@!>]/g, '');
      let user = await guild?.members.fetch(memberId);
      user?.roles.add(role!);
    });

    await guild?.channels.create({
      name: discordSafe + '-chat',
      type: ChannelType.GuildText,
      parent: '1279700405647052885',
      permissionOverwrites:
      [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role!.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    await guild?.channels.create({
      name: discordSafe + '-submissions',
      type: ChannelType.GuildText,
      parent: '1279700405647052885',
      permissionOverwrites:
      [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: role!.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    // Setup 3 cards: PVM, Clues, Skilling
    const pvmCard = this.convertCard(PVMCard, role!.id, 'PVM');
    const cluesCard = this.convertCard(CluesCard, role!.id, 'Clues');
    const skillingCard = this.convertCard(SkillingCard, role!.id, 'Skilling');

    await setupTeam(pvmCard);
    await setupTeam(cluesCard);
    await setupTeam(skillingCard);


    interaction.followUp(`You are setting up a new bingo team with the name ${teamname}`);
  }
}