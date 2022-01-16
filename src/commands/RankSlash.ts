import { CommandInteraction, EmbedFieldData, GuildMemberRoleManager, Interaction, MessageEmbed, Role } from "discord.js";
import { Discord, MetadataStorage, Slash, SlashOption, SlashGroup} from "discordx";
import { Pagination } from "@discordx/utilities";
import { clan } from "runescape-api";

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
      
      // console.log(interaction.member.user.id);
      // interaction.reply(String(person?.rank));

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
    });
  }

  @Slash("set", { description: "Set your clan rank" })
  @SlashGroup("rank")
  async setRank(interaction: CommandInteraction){
    // if ((interaction.member.roles as GuildMemberRoleManager).cache.some(role => role.name === 'Admin')) {
    //   interaction.reply(String(interaction.channelId));
    // } else {
    //   interaction.reply(String('Nice try'));
    // }
    clan.getMembers("The Enduring").then(async data => {
      const person = data.find(person => person.name === "wizages");
      let guild = await interaction.guild?.fetch();

      let role = guild?.roles.cache.find(r => r.name == "General");
      
      (interaction.member.roles as GuildMemberRoleManager).add(role);
      console.log(interaction.member.user.id);
      interaction.reply(String(person?.rank));
    });
  }

}

