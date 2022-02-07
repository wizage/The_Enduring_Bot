import { ButtonInteraction, CommandInteraction, EmbedFieldData, Role, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User as DiscordUser } from "discord.js";
import { Discord, Slash, SlashOption, SlashGroup, On, ButtonComponent} from "discordx";


@Discord()
export abstract class ClueSlash {

  static readonly verifyFields: EmbedFieldData[] = [{
    "name": "Discord",
    "value": '',
    "inline": true
  },
  {
    "name": "Submitted URL",
    "value": '',
    "inline": true
  },
  ];

  @Slash('submit', { description: "Submit a new record or apply for a new discord role"})
  async submitRecord(
    @SlashOption('url', {description: 'Please paste a link to your image or video'})
    submittedURL:string,
    @SlashOption('role', {description: 'Role you are applying for'})
    role:Role,
    interaction: CommandInteraction
  ){
    let imageurl = submittedURL;
    const submitEmbedded = new MessageEmbed()
            .setTitle("**Successfully submitted**");
            
    if(submittedURL.includes('youtube') || submittedURL.includes('youtu.be')){
      var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = submittedURL.match(regExp);
      if (match && match[2].length == 11) {
        imageurl =  `http://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
      }
      submitEmbedded.addField('Video URL', submittedURL);
    }
    submitEmbedded.setImage(imageurl);
    interaction.reply({embeds:[submitEmbedded], ephemeral:false});

    let verifyChannel = interaction.client.channels.cache.get('932331442669776916') as TextChannel;
    let verifyEmbed = ClueSlash.verifyFields;
    verifyEmbed[0].value = `<@${interaction.user.id}>`;
    verifyEmbed[1].value = submittedURL;
    const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId(`accept-sub-${interaction.id}`)
          .setLabel('Validate')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId(`deny-sub-${interaction.id}`)
          .setLabel('Deny')
          .setStyle('DANGER'),
    );

    const embedVerify = new MessageEmbed({title: 'New Submission', fields: verifyEmbed, description:'Please verify new user'});
    await verifyChannel.send({embeds:[embedVerify], components:[row]});
    // let StringRole = "";
    // if (person?.rank && !RankSlash.ADMIN_RANKS.includes(person?.rank)) {
    //   StringRole = person?.rank;
    // } else {
    //   StringRole = "Guest";
    // }
    // fields[1].value = person?.rank;
    // fields[2].value = this.numberWithCommas(person?.experience);
    // this.addRole(interaction, StringRole);
    // const embed = new MessageEmbed({title: 'Current Rank', fields: fields  });
    // interaction.reply({embeds:[embed], ephemeral:true});
  }

}