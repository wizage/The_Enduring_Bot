import { ButtonInteraction, CommandInteraction, GuildMemberRoleManager, ActionRowBuilder, ButtonBuilder, EmbedBuilder, TextChannel, MessageActionRowComponentBuilder, Role } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup, ButtonComponent } from 'discordx';
import { APIEmbedField, ApplicationCommandOptionType, ButtonStyle } from 'discord-api-types/v10';
import { Pagination, PaginationItem, PaginationType } from '@discordx/pagination';
import { RunescapeAPI } from 'runescape-api-ts';
import { User, RankUps } from '../types/User';
import { createUser, getUser, verifyUser } from '../backend/models/User.js';
import { overwriteRanks } from '../constants/rankoverwrites.js';

@Discord()
@SlashGroup({ name: 'rank', description: 'Commands to set your server rank/role' })
export abstract class RankSlash {

  static readonly ADMIN_RANKS: string[] = [
    'Owner', 'Deputy Owner', 'Overseer', 'Coordinator', 'Organiser', 'Admin', // Admin roles
  ];

  static readonly CLAN_RANKS: string[] = [
    'General', 'Captain', 'Lieuntenant', 'Sergeant', 'Corporal', 'Recruit', 'Guest', // Normal roles
  ];

  static readonly embedFields: APIEmbedField[] = [{
    'name': 'Username',
    'value': '',
    'inline': true,
  },
  {
    'name': 'Rank',
    'value': 'Guest',
    'inline': true,
  },
  {
    'name': 'Clan XP',
    'value': 'N/A',
    'inline': true,
  }];

  static readonly verifyFields: APIEmbedField[] = [{
    'name': 'RSN',
    'value': '',
    'inline': true,
  },
  {
    'name': 'Rank',
    'value': 'Guest',
    'inline': true,
  },
  {
    'name': 'Discord',
    'value': '',
    'inline': true,
  },
  ];

  private numberWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private async addRole(interaction: CommandInteraction, roleName: string) {
    let guild = await interaction.guild?.fetch();

    let role = guild?.roles.cache.find( (r: Role) => r.name == roleName);
    if (!role) {
      await guild?.roles.create({
        name: roleName,
      });
      role = guild?.roles.cache.find((r: Role) => r.name == roleName);
    }
    // Get current roles
    let currentRoles = (interaction.member!.roles as GuildMemberRoleManager).cache.filter((roleFilter: Role) => (RankSlash.ADMIN_RANKS.includes(roleFilter.name) || RankSlash.CLAN_RANKS.includes(roleFilter.name)));
    // 
    currentRoles.forEach((current_role: Role) => {
      if (current_role.name != roleName) {
        (interaction.member!.roles as GuildMemberRoleManager).remove(current_role);
      }
    });
    if (role) {
      (interaction.member!.roles as GuildMemberRoleManager).add(role);
    }
  }

  @ButtonComponent({ id:/(confirm-user-*)\w+/g })
  async confirmUser(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    const userId = interaction.customId.split('-');
    const result = await verifyUser(userId[2], true);
    if (result.err) {
      console.log('Error: valid saving', result.err);
    } else {
      
      if (interaction.user) {
        console.log('responding');
        // const message = (interaction.message as Message);
        const embedVerify = interaction.message.embeds[0];
        // interaction.
        const newEmbed = EmbedBuilder.from(embedVerify).setDescription(`✅ Verified by <@${interaction.user.id}> ✅`);
        interaction.editReply({ embeds: [newEmbed] });
      }
    }
  }

  @ButtonComponent({ id:/(deny-user-*)\w+/g })
  async denyUser(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    const userId = interaction.customId.split('-');
    const result = await verifyUser(userId[2], false);
    if (result.err) {
      console.log('Error: valid saving', result.err);
    } else {
      if (interaction.user) {
        // const message = (interaction.message as Message);
        const embedVerify = interaction.message.embeds[0];
        // interaction.
        const newEmbed = EmbedBuilder.from(embedVerify).setDescription(`❌ Denied by <@${interaction.user.id}> ❌`);
        interaction.editReply({ embeds: [newEmbed] });
      }
    }
  }

  @Slash({ name: 'new-ranks', description: 'List new rank-ups needed' })
  @SlashGroup('rank')
  async getAllClannies(
    interaction: CommandInteraction) {
    RunescapeAPI.clan.getMembers('The Enduring').then(async data => {
      let needRanks: RankUps[] = [];
      for (const clanny of data) {
        if (overwriteRanks[clanny.name]) {
          //Do nothing
        } else if (RankSlash.ADMIN_RANKS.includes(clanny.rank)) {
          //Do nothing
        } else if (clanny.experience >= 1000000000) {
          if (clanny.rank !== 'General') {
            needRanks.push({ clanny, newRank: 'General' });
          }
        } else if (clanny.experience >= 500000000) {
          if (clanny.rank !== 'Captain') {
            needRanks.push({ clanny, newRank: 'Captain' });
          }
        } else if (clanny.experience >= 200000000) {
          if (clanny.rank !== 'Lieutenant') {
            needRanks.push({ clanny, newRank: 'Lieutenant' });
          }
        } else if (clanny.experience >= 100000000) {
          if (clanny.rank !== 'Sergeant') {
            needRanks.push({ clanny, newRank: 'Sergeant' });
          }
        } else if (clanny.experience >= 50000000) {
          if (clanny.rank !== 'Corporal') {
            needRanks.push({ clanny, newRank: 'Corporal ' });
          }
        }
      }
      if (needRanks.length > 0) {
        const pages = needRanks.map((needRank, i) => {
          const embeder = new EmbedBuilder()
            .setFooter({ text: `Page ${i + 1} of ${needRanks.length}` })
            .setTitle('**Rankup**')
            .addFields([
              { name:'RSN', value:needRank.clanny.name, inline: true },
              { name:'Current Rank', value: needRank.clanny.rank, inline:true },
              { name:'New Rank', value: needRank.newRank, inline:true },
              { name:'Clan Xp', value: this.numberWithCommas(needRank.clanny.experience), inline:true },
            ]);
          const page : PaginationItem = {
            embeds: [embeder],
          };
          return page;
        });

        const pagination = new Pagination(interaction, pages, { type: PaginationType.Button, ephemeral: true, time: 600000 });
        await pagination.send();
      } else {
        let noneofthat = new EmbedBuilder()
          .setTitle('**Rankup**')
          .setDescription('🎉 Everyone is ranked up 🎉');
        interaction.reply({ embeds: [noneofthat], ephemeral: true });
      }
    });
  }

  @Slash({ name:'config', description: 'Config your discord with your rsn' })
  @SlashGroup('rank')
  async setRSN(
  @SlashOption({ name:'rsn', description: 'Runescape Username', required: true,  type: ApplicationCommandOptionType.String })
    rsn: string,
    interaction: CommandInteraction) {
      
    RunescapeAPI.clan.getMembers('The Enduring').then(async data => {
      const person = data.find(personF => personF.name.toLowerCase() === rsn.toLowerCase());
      let fields = RankSlash.embedFields;
      fields[0].value = person?.name || rsn;
      if (!interaction.member) {
        const embed = new EmbedBuilder({ title: 'Server Error', description: '❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n No \'interaction.member\' was found' });
        interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      if (person) {
        // Fixes Capitalization issues
        rsn = person?.name;
      }

      let dbUser: User = {
        discordID: interaction.member.user.id,
        discordname: interaction.member.user.username,
        rsn: rsn,
        valid: false,
      };
      const result = await createUser(dbUser);
      if (result.err) {
        if (result.err instanceof Error && result.err.name == 'userExist') {
          const embed = new EmbedBuilder({
            title: 'Current Rank', description: '❌ Error: A user already has registered this RSN and has been verified! ❌ \n \n \
             If you think this is incorrect, please contact an admin to help you out!'  });
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        } else {
          const embed = new EmbedBuilder({ title: 'Server Error', description: `❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n ${result.err}` });
          interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } else if (result.wrongCommand) {
        this.setRank(interaction);
      } else {
        let channelId = '';
        if (interaction.guildId === '932144876659822623') {
          channelId = '932331442669776916';
        } else if (interaction.guildId === '198166521573408768') {
          channelId = '1022554962439450674';
        }
        let verifyChannel = interaction.client.channels.cache.get(channelId) as TextChannel;
        let verifyEmbed = RankSlash.verifyFields;
        verifyEmbed[0].value = rsn;
        verifyEmbed[1].value = person?.rank || 'Guest';
        verifyEmbed[2].value = `<@${interaction.user.id}>`;
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm-user-${dbUser.discordID}`)
            .setLabel('Validate')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`deny-user-${dbUser.discordID}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger),
        );

        const embedVerify = new EmbedBuilder({ title: 'New Registered RSN', fields: verifyEmbed, description: 'Please verify new user' });
        await verifyChannel.send({ embeds: [embedVerify], components: [row] });
        let StringRole = '';
        if (person?.rank && !RankSlash.ADMIN_RANKS.includes(person?.rank)) {
          StringRole = `Clan ${person?.rank}`;
        } else {
          StringRole = 'Guest';
        }
        if (!person) {
          fields[1].value = 'Guest';
          fields[2].value = 'Not in clan';
        } else {
          fields[1].value = person?.rank || 'Guest';
          fields[2].value = this.numberWithCommas(person?.experience);
        }
        this.addRole(interaction, StringRole);
        const embed = new EmbedBuilder({ title: 'Current Rank', fields: fields });
        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    });
  }

  @Slash({ name:'update', description: 'Update your clan discord rank' })
  @SlashGroup('rank')
  async setRank(interaction: CommandInteraction) {
    const userResults = await getUser(interaction.member!.user.id);
    if (userResults.err || !userResults.result) {
      if (userResults.err instanceof Error && userResults.err.name == 'noUser') {
        const embed = new EmbedBuilder({
          title: 'Current Rank', description: '❌ Error: No RSN Configured ❌ \n \n \
           Please use `/rank config` to configure your RSN.'  });
        interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      } else {
        const embed = new EmbedBuilder({ title: 'Server Error', description: `❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n ${userResults.err}` });
        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      RunescapeAPI.clan.getMembers('The Enduring').then(async data => {
        console.log(data);
        const person = data.find(personF => personF.name === userResults.result.rsn);
        let fields = RankSlash.embedFields;
        fields[0].value = person?.name || userResults.result.rsn;
        if (!person?.rank) {
          const embed = new EmbedBuilder({ title: 'Current Rank', fields: fields });

          this.addRole(interaction, 'Guest');
          interaction.reply({ embeds: [embed], ephemeral: true });
          return;
        }
        let StringRole = '';
        if (person?.rank && (!RankSlash.ADMIN_RANKS.includes(person?.rank) || userResults.result.valid)) {
          StringRole = `Clan ${person?.rank}`;
        } else {
          StringRole = 'Guest';
        }
        fields[1].value = person?.rank;
        fields[2].value = this.numberWithCommas(person?.experience);
        this.addRole(interaction, StringRole);
        const embed = new EmbedBuilder({ title: 'Current Rank', fields: fields });
        interaction.reply({ embeds: [embed], ephemeral: true });
      });
    }
  }

}

