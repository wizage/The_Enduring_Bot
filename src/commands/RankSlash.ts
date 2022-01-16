import { Collection, CommandInteraction, DiscordAPIError, EmbedFieldData, Emoji, GuildMemberRoleManager, Interaction, MessageActionRow, MessageEmbed, MessageReaction, ReactionUserManager, Role, TextChannel, User as DiscordUser } from "discord.js";
import { Discord, MetadataStorage, Slash, SlashOption, SlashGroup} from "discordx";
import { Pagination } from "@discordx/utilities";
import { clan } from "runescape-api";
import { User } from "../backend/types/User";
import { createUser, getUser, verifyUser } from "../backend/models/User.js";
import e from "express";
import { ClanMember } from "runescape-api/lib/RuneScape";

@Discord()
@SlashGroup("role", "Commands to set your server rank/role", {
  rank: "Set your rank from role",
})
export abstract class RankSlash {

  static readonly ADMIN_RANKS: string[] = [
    "Owner", "Deputy Owner", "Overseer", "Coordinator", "Organiser", "Admin", // Admin roles
  ];
  static readonly CLAN_RANKS: string[] = [
    "General", "Captain", "Lieuntenant", "Sergeant", "Corporal", "Recruit", "Guest", // Normal roles
  ];

  static readonly embedFields: EmbedFieldData[] = [{
    "name": "Username",
    "value": '',
    "inline": true
  },
  {
    "name": "Rank",
    "value": "Guest",
    "inline": true
  },
  {
    "name": "Clan XP",
    "value": "N/A",
    "inline": true
  }];

  static readonly verifyFields: EmbedFieldData[] = [{
    "name": "RSN",
    "value": '',
    "inline": true
  },
  {
    "name": "Rank",
    "value": "Guest",
    "inline": true
  },
  {
    "name": "Discord",
    "value": "",
    "inline": true
  },
  ];

  private numberWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  private async addRole(interaction: CommandInteraction, roleName: string) {
    let guild = await interaction.guild?.fetch();
   
    let role = guild?.roles.cache.find(r => r.name == roleName);
    if (!role){
      await guild?.roles.create({
        name: roleName,
      });
      role = guild?.roles.cache.find(r => r.name == roleName);
    }
    // Get current roles
    let current_roles = (interaction.member.roles as GuildMemberRoleManager).cache.filter((role) => (RankSlash.ADMIN_RANKS.includes(role.name) || RankSlash.CLAN_RANKS.includes(role.name)));
    // 
    current_roles.forEach((current_role) => {
      if (current_role.name != roleName){
        (interaction.member.roles as GuildMemberRoleManager).remove(current_role);
      }
    });
    if (role) {
      (interaction.member.roles as GuildMemberRoleManager).add(role);
    }
  }
  // example: pagination for all slash command
  @Slash("all-commands", { description: "Pagination for all slash command" })
  async pages(interaction: CommandInteraction): Promise<void> {
    const commands = MetadataStorage.instance.applicationCommands.map((cmd) => {
      return { name: cmd.name, description: cmd.description };
    });

    const pages = commands.map((cmd, i) => {
      return new MessageEmbed()
        .setFooter(`Page ${i + 1} of ${commands.length}`)
        .setTitle("**Slash command info**")
        .addField("Name", cmd.name)
        .addField("Description", cmd.description);
    });

    const pagination = new Pagination(interaction, pages);
    await pagination.send();
  }

  @Slash("new-ranks", { description: "Config your discord with your rsn" })
  @SlashGroup("rank")
  async getAllClannies( 
    interaction: CommandInteraction) 
  {
    clan.getMembers("The Enduring").then(async data => {
      let needRanks = [];
      for(const clanny of data){
        if (RankSlash.ADMIN_RANKS.includes(clanny.rank)){
          //Do nothing
        } else if (clanny.experience >= 500000000 ){
          if(clanny.rank !== 'General'){
            needRanks.push({clanny, newRank: "General"});
          }
        } else if (clanny.experience >= 300000000) {
          if(clanny.rank !== 'Captain'){
            needRanks.push({clanny, newRank: "Captain"});
          }
        } else if (clanny.experience >= 150000000) {
          if(clanny.rank !== 'Lieutenant'){
            needRanks.push({clanny, newRank: "Lieutenant"});
          }
        } else if (clanny.experience >= 75000000) {
          if(clanny.rank !== 'Sergeant'){
            needRanks.push({clanny, newRank: "Sergeant"});
          }
        } else if (clanny.experience >= 15000000) {
          if(clanny.rank !== 'Corporal'){
            needRanks.push({clanny, newRank: "Corporal "});
          }
        }
      };
      if (needRanks.length > 0){
        const pages = needRanks.map((needRank, i) => {
          return new MessageEmbed()
            .setFooter(`Page ${i+1} of ${needRanks.length}`)
            .setTitle("**Rankup**")
            .addField("RSN", needRank.clanny.name,true)
            .addField("Current Rank", needRank.clanny.rank, true)
            .addField("New Rank", needRank.newRank, true)
            .addField("Clan Xp", this.numberWithCommas(needRank.clanny.experience), true);
        });
    
        const pagination = new Pagination(interaction, pages, {type:"BUTTON", ephemeral:true});
        await pagination.send();
      } else {
        let noneofthat = new MessageEmbed()
            .setTitle("**Rankup**")
            .setDescription("🎉 Everyone is ranked up 🎉");
        interaction.reply({embeds:[noneofthat], ephemeral:true});
      }
    });
      
  }

  @Slash("config", { description: "Config your discord with your rsn" })
  @SlashGroup("rank")
  async setRSN( 
    @SlashOption("rsn", { description: "Runescape Username", required: true })
    rsn: string, 
    interaction: CommandInteraction)
    {
    clan.getMembers("The Enduring").then(async data => {
      const person = data.find(person => person.name.toLowerCase() === rsn.toLowerCase());
      let fields = RankSlash.embedFields;
      fields[0].value = person?.name || rsn;
      if (!person?.rank){
        const embed = new MessageEmbed({title: 'Current Rank', fields: fields});
        
        this.addRole(interaction, 'Guest');
        interaction.reply({embeds:[embed], ephemeral:true});
        return;
      } else {
        // Fixes Capitalization issues
        rsn = person?.name;
      }
      
      let dbUser: User = {
        discordID: interaction.member.user.id,
        discordname: interaction.member.user.username,
        rsn: rsn,
        valid: false,
      };

      createUser(dbUser, async (err: Error, result: string) => {
        if (err) {
          if (err.name == 'userExist'){
            const embed = new MessageEmbed({title: 'Current Rank', description: '❌ Error: A user already has registered this RSN and has been verified! ❌ \n \n \
             If you think this is incorrect, please contact an admin to help you out!'  });
            interaction.reply({embeds:[embed], ephemeral:true});
            return;
          } else {

          }
        } else {
          // console.log(message);
          let verifyChannel = interaction.client.channels.cache.get('932331442669776916') as TextChannel;
          let verifyEmbed = RankSlash.verifyFields;
          verifyEmbed[0].value = rsn;
          verifyEmbed[1].value = person?.rank || 'Guest';
          verifyEmbed[2].value = `<@${interaction.user.id}>`
          const embedVerify = new MessageEmbed({title: 'New Registered RSN', fields: verifyEmbed, description:'Please verify new user'});
          const message = await verifyChannel.send({embeds:[embedVerify]});
          await message.react('✅');
          await message.react('❌');
          const filter = (reaction : MessageReaction, user: DiscordUser) => ( reaction.emoji.name === '✅' ||  reaction.emoji.name === '❌' ) && !user.bot;
          message.awaitReactions({filter, max:1}).then( async (collected)=>{
            let react = collected.first();
            if (!react){
              return;
            }
            let users = await react?.users.fetch() as Collection<string, DiscordUser>;
            let userReactor = users.first();
            if (react?.emoji.name === '✅'){
              verifyUser(dbUser.discordID, true, (err: Error, result: string) => {
                if (err) {
                  console.log("Error: valid saving", err)
                } else {
                  if (userReactor) {
                    embedVerify.description = `✅ Verified by <@${userReactor.id}> ✅`;
                    message.edit({embeds:[embedVerify]});
                    message.reactions.removeAll();
                  }
                }
              });
            } else if (react?.emoji.name === '❌') {
              if (userReactor) {
                embedVerify.description = `❌ Denied by <@${userReactor.id}> ❌`;
                message.edit({embeds:[embedVerify]});
                message.reactions.removeAll();
              }
            }
          });
          let StringRole = "";
          if (person?.rank && !RankSlash.ADMIN_RANKS.includes(person?.rank)) {
            StringRole = person?.rank;
          } else {
            StringRole = "Guest";
          }
          fields[1].value = person?.rank;
          fields[2].value = this.numberWithCommas(person?.experience);
          this.addRole(interaction, StringRole);
          const embed = new MessageEmbed({title: 'Current Rank', fields: fields  });
          interaction.reply({embeds:[embed], ephemeral:true});
        }
      });

      
    });
  }

  @Slash("update", { description: "Update your clan discord rank" })
  @SlashGroup("rank")
  async setRank(interaction: CommandInteraction){
    getUser(interaction.member.user.id, (err: Error, result: User)=> {
      if (err) {
        console.log(err);
      } else {
        clan.getMembers("The Enduring").then(async data => {
          const person = data.find(person => person.name === result.rsn);
          let fields = RankSlash.embedFields;
          fields[0].value = person?.name || result.rsn;
          if (!person?.rank){
            const embed = new MessageEmbed({title: 'Current Rank', fields: fields});
            
            this.addRole(interaction, 'Guest');
            interaction.reply({embeds:[embed], ephemeral:true});
            return;
          }
          let StringRole = "";
          if (person?.rank && (!RankSlash.ADMIN_RANKS.includes(person?.rank) || result.valid)) {
            StringRole = person?.rank;
          } else {
            StringRole = "Guest";
          }
          fields[1].value = person?.rank;
          fields[2].value = this.numberWithCommas(person?.experience);
          this.addRole(interaction, StringRole);
          const embed = new MessageEmbed({title: 'Current Rank', fields: fields  });
          interaction.reply({embeds:[embed], ephemeral:true});
        });
      }
    });
  }

}

