import { ChannelType, CommandInteraction, PermissionFlagsBits, PermissionsBitField, Role } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { createCanvas, Image } from 'canvas';
import { getCard, setupTeam } from '../backend/models/Bingo.js';
import { BingoCard, BingoItem } from '../types/Bingo';
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
      card: ddbCard,
    };
    return bingoCard;
  };

  private drawBingoCard = async (cardType: string, cardChecks: BingoCard) : Promise<Buffer> => {
    

    // Dimensions for the image
    const size = 5;
    const squareSize = 150;
    const width = size * squareSize + 10;
    const height = width;

    // Instantiate the canvas object
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.font = '150pt Sans';

    // Fill the rectangle with purple
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // const data = fs.readFileSync(__dirname + `/${cardType}.png`);
    const imageLoad = new Promise<Image>((resolve) => {
      var img = new Image;
      let src = '';
      if (cardType === 'PVM') {
        src = 'https://github.com/wizage/The_Enduring_Bot/blob/dockerize/static_images/PVM.png?raw=true';
      } else if (cardType === 'Clues') {
        src = 'https://github.com/wizage/The_Enduring_Bot/blob/dockerize/static_images/Clues.png?raw=true';
      } else if (cardType === 'Skilling') {
        src = 'https://github.com/wizage/The_Enduring_Bot/blob/dockerize/static_images/Skilling.png?raw=true';
      }
      img.src = src;
      img.onload = () => {
        resolve(img);
      };
    });
    const img: Image = await imageLoad;
    context.drawImage(img, 0, 0);
    cardChecks.card.forEach((row, column) => {
      row.forEach((slot, index) => {
        let current = 0;
        slot.value.forEach((value) => {
          current += value;
        });
        if (current === slot.value.length) {
          context.fillStyle = '#df5e42';
          let x = (index * 150 + 20);
          let y = (column * 150 + 152.5);
          context.font = '150pt Sans';
          context.fillText('X', x, y);
        } else if (current > 0) {
          context.fillStyle = 'rgba(11, 183, 0, 0.75)';
          let x = (index * 150 + 5);
          let y = (column * 150 + 5);
          // Horizontal bar :
          // let newY = 150 - ((current / slot.value.length) * 150) + y;
          // let heightCalc = ((current / slot.value.length) * 150);
          // context.fillRect(x, newY, 150, heightCalc);
          // Vertical bar :
          //let newX = 150 - ((current / slot.value.length) * 150) + x;
          // let widthCalc = ((current / slot.value.length) * 150);
          // context.fillRect(x, y, widthCalc, 150);
          // Vertical small bar :
          let newY = 125 + y;
          let widthCalc = ((current / slot.value.length) * 150);
          context.fillRect(x, newY, widthCalc, 25);
          context.fillStyle = '#000000';
          context.font = '14pt Sans';
          context.fillText(`${current}/${slot.value.length}`, x + 60, newY + 19.5);
        }
      });
    });
    const buffer = canvas.toBuffer('image/png');
    return buffer;
  };

  @Slash({ name: 'draw-card', description: 'Draw new card' })
  @SlashGroup('mod')
  async drawCard(
    @SlashOption({
      description: 'Provide the team role',
      name: 'teamrole',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    teamrole: string,
    @SlashOption({
      description: 'Provide the card',
      name: 'cardtype',
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    cardtype: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const roleId = teamrole.replace(/[<@&>]/g, '');
    if (cardtype !== 'PVM' && cardtype !== 'Clues' && cardtype !== 'Skilling') {
      interaction.followUp('Invalid card type');
      return;
    }

    const cardChecks = await getCard(cardtype, roleId);
    if (!cardChecks) {
      interaction.followUp('role id does not exist');
      return;
    }

    const buffer = await this.drawBingoCard(cardtype, cardChecks!);

    await interaction.followUp({ files: [buffer] });
  }

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
    let parent = '';
    let councilId = '';

    if (interaction.guildId === '932144876659822623') { 
      parent = '1279700405647052885';
      councilId = '1279509034063499326';

    } else if (interaction.guildId === '198166521573408768') { //enduring
      parent = '1280305494552215614';
      councilId = '1054799296404394124';
    }


    await guild?.channels.create({
      name: discordSafe + '-chat',
      type: ChannelType.GuildText,
      parent: parent,
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
        {
          id: councilId,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    await guild?.channels.create({
      name: discordSafe + '-submissions',
      type: ChannelType.GuildText,
      parent: parent,
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
        {
          id: councilId,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    await guild?.channels.create({
      name: discordSafe + '-cards',
      type: ChannelType.GuildText,
      parent: parent,
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
        {
          id: role!.id,
          deny: [PermissionsBitField.Flags.SendMessages],
        },
        {
          id: councilId,
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