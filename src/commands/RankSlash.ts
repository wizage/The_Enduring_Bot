import { ButtonInteraction, CommandInteraction, EmbedFieldData, GuildMemberRoleManager, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User as DiscordUser } from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, On, ButtonComponent} from "discordx";
import { Pagination } from "@discordx/pagination";
import { clan } from "runescape-api";
import { User } from "../backend/types/User";
import { createUser, getUser, verifyUser } from "../backend/models/User.js";

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
    let current_roles = (interaction.member!.roles as GuildMemberRoleManager).cache.filter((role) => (RankSlash.ADMIN_RANKS.includes(role.name) || RankSlash.CLAN_RANKS.includes(role.name)));
    // 
    current_roles.forEach((current_role) => {
      if (current_role.name != roleName){
        (interaction.member!.roles as GuildMemberRoleManager).remove(current_role);
      }
    });
    if (role) {
      (interaction.member!.roles as GuildMemberRoleManager).add(role);
    }
  }

  @ButtonComponent(/(confirm-user-*)\w+/g)
  confirmUser(interaction: ButtonInteraction){
    const userId = interaction.customId.split('-');
    verifyUser(userId[2], true, async (err: Error, result: string) => {
      if (err) {
        console.log("Error: valid saving", err)
      } else {
        if (interaction.user) {
          const message = (interaction.message as Message);
          const embedVerify = interaction.message.embeds[0];
          // interaction.
          embedVerify.description = `✅ Verified by <@${interaction.user.id}> ✅`;
          interaction.update({embeds:[embedVerify]});
        }
      }
    });
    
  }

  @ButtonComponent(/(deny-user-*)\w+/g)
  async denyUser(interaction: ButtonInteraction){
    const userId = interaction.customId.split('-');
    verifyUser(userId[2], false, async (err: Error, result: string) => {
      if (err) {
        console.log("Error: valid saving", err)
      } else {
        if (interaction.user) {
          const message = (interaction.message as Message);
          const embedVerify = interaction.message.embeds[0];
          // interaction.
          embedVerify.description = `❌ Denied by <@${interaction.user.id}> ❌`;
          interaction.update({embeds:[embedVerify]});
        }
      }
    });

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
            .setFooter({ text:`Page ${i+1} of ${needRanks.length}` })
            .setTitle("**Rankup**")
            .addField("RSN", needRank.clanny.name,true)
            .addField("Current Rank", needRank.clanny.rank, true)
            .addField("New Rank", needRank.newRank, true)
            .addField("Clan Xp", this.numberWithCommas(needRank.clanny.experience), true);
        });
    
        const pagination = new Pagination(interaction, pages, {type:"BUTTON", ephemeral:true, time:600000});
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
    @SlashOption("rsn", { description: "Runescape Username" })
    rsn: string, 
    interaction: CommandInteraction)
    {
    clan.getMembers("The Enduring").then(async data => {
      const person = data.find(person => person.name.toLowerCase() === rsn.toLowerCase());
      let fields = RankSlash.embedFields;
      fields[0].value = person?.name || rsn;
      if (!person || !interaction.member){
        fields[1].value = 'Guest';
        fields[2].value = 'N/A';
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
          console.log(dbUser);
          const row = new MessageActionRow().addComponents(
              new MessageButton()
                .setCustomId(`confirm-user-${dbUser.discordID}`)
                .setLabel('Validate')
                .setStyle('SUCCESS'),
              new MessageButton()
                .setCustomId(`deny-user-${dbUser.discordID}`)
                .setLabel('Deny')
                .setStyle('DANGER'),
          );

          const embedVerify = new MessageEmbed({title: 'New Registered RSN', fields: verifyEmbed, description:'Please verify new user'});
          await verifyChannel.send({embeds:[embedVerify], components:[row]});
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
    getUser(interaction.member!.user.id, (err: Error, result: User)=> {
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

