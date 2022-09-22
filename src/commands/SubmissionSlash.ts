// import { ButtonInteraction, CommandInteraction, EmbedFieldData, Role, Message, MessageActionRow, MessageButton, MessageEmbed, TextChannel, User as DiscordUser } from "discord.js";
// import { Discord, Slash, SlashOption, SlashGroup, On, ButtonComponent, Client } from "discordx";


// @Discord()
// export abstract class ClueSlash {

//   static readonly ADMIN_RANKS: string[] = [
//     "Owner", "Deputy Owner", "Overseer", "Coordinator", "Organiser", "Admin", // Admin roles
//   ];
//   static readonly CLAN_RANKS: string[] = [
//     "General", "Captain", "Lieuntenant", "Sergeant", "Corporal", "Recruit", "Guest", // Normal roles
//   ];

//   static readonly verifyFields: EmbedFieldData[] = [{
//     "name": "Discord",
//     "value": '',
//     "inline": true
//   },
//   {
//     "name": "Submitted URL",
//     "value": '',
//     "inline": true
//   },
//   {
//     "name": "Role Applied For:",
//     "value": '',
//     "inline": true
//   },
//   ];

//   @ButtonComponent(/(queue-sub-*)\w+/g)
//   async queuesub(interaction: ButtonInteraction) {
//     const message = (interaction.message as Message);
//     const embedVerify = message.embeds[0];
//     const userId = interaction.customId.split('-');
//     const user = interaction.client.users.cache.get(userId[2]);
//     embedVerify.description = `${embedVerify.description}\n❓ Under review by <@${interaction.user.id}> ❓`
//     const roleString = embedVerify.fields[2].value;
//     const roleid = roleString.substring(3, roleString.length - 1);
//     let role = interaction.guild!.roles.cache.find(r => r.id === roleid);
//     if (user && role) {
//       embedVerify.fields[2].value = role.name;
//       await user.send({ embeds: [embedVerify] });
//     }
//     embedVerify.fields[2].value = `<@&${role?.id}>`
//     interaction.update({ embeds: [embedVerify] });
//   }


//   @ButtonComponent(/(accept-sub-*)\w+/g)
//   async acceptsub(interaction: ButtonInteraction) {
//     const message = (interaction.message as Message);
//     const buttonRow = message.components[0];
//     const embedVerify = message.embeds[0];
//     const userId = interaction.customId.split('-');
//     const user = interaction.client.users.cache.get(userId[2]);
//     embedVerify.description = `${embedVerify.description}\n ✅ Approved by <@${interaction.user.id}> ✅`
//     const roleString = embedVerify.fields[2].value;
//     const roleid = roleString.substring(3, roleString.length - 1);
//     let role = interaction.guild!.roles.cache.find(r => r.id === roleid);
//     if (user && role) {
//       embedVerify.fields[2].value = role.name;
//       await user.send({ embeds: [embedVerify] });
//       const member = await interaction.guild?.members.fetch({ user: user });
//       member?.roles.add(role);
//     }
//     embedVerify.fields[2].value = `<@&${role?.id}>`
//     buttonRow.components[1].setDisabled(true);
//     buttonRow.components[2].setDisabled(false);
//     interaction.update({ embeds: [embedVerify], components: [buttonRow] });
//   }

//   @ButtonComponent(/(deny-sub-*)\w+/g)
//   async denysub(interaction: ButtonInteraction) {
//     const message = (interaction.message as Message);
//     const buttonRow = message.components[0];
//     const embedVerify = message.embeds[0];
//     const userId = interaction.customId.split('-');
//     const user = interaction.client.users.cache.get(userId[2]);
//     embedVerify.description = `${embedVerify.description}\n ❌ Denied by <@${interaction.user.id}> ❌`
//     const roleString = embedVerify.fields[2].value;
//     const roleid = roleString.substring(3, roleString.length - 1);
//     let role = interaction.guild!.roles.cache.find(r => r.id === roleid);
//     if (user && role) {
//       embedVerify.fields[2].value = role.name;
//       await user.send({ embeds: [embedVerify] });
//       const member = await interaction.guild?.members.fetch({ user: user });
//       member?.roles.remove(role);
//     }
//     embedVerify.fields[2].value = `<@&${role?.id}>`
//     buttonRow.components[1].setDisabled(false);
//     buttonRow.components[2].setDisabled(true);
//     interaction.update({ embeds: [embedVerify], components: [buttonRow] });
//   }

//   @Slash('submit', { description: "Submit a new record or apply for a new discord role" })
//   async submitRecord(
//     @SlashOption('url', { description: 'Please paste a link to your image or video' })
//     submittedURL: string,
//     @SlashOption('role', { description: 'Role you are applying for' })
//     role: Role,
//     interaction: CommandInteraction
//   ) {
//     let imageurl = submittedURL;

//     if (ClueSlash.ADMIN_RANKS.indexOf(role.name) !== -1 || ClueSlash.CLAN_RANKS.indexOf(role.name) !== -1) {
//       const errorEmbed = new MessageEmbed()
//         .setTitle("**Error Submitting**")
//         .addField(`Invalid Role`, `<@&${role.id}> is not available to request`)
//       interaction.reply({ embeds: [errorEmbed], ephemeral: true });
//       return;
//     }
//     const submitEmbedded = new MessageEmbed()
//       .setTitle("**Successfully submitted**");
//     if (submittedURL.includes('youtube') || submittedURL.includes('youtu.be')) {
//       var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
//       var match = submittedURL.match(regExp);
//       if (match && match[2].length == 11) {
//         imageurl = `http://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
//       }
//       submitEmbedded.addField('Video URL', submittedURL);
//     }
//     submitEmbedded.setImage(imageurl);

//     let verifyChannel = interaction.client.channels.cache.get('932331442669776916') as TextChannel;
//     let verifyEmbed = ClueSlash.verifyFields;
//     verifyEmbed[0].value = `<@${interaction.user.id}>`;
//     verifyEmbed[1].value = submittedURL;
//     verifyEmbed[2].value = `<@&${role.id}>`;
//     const row = new MessageActionRow().addComponents(
//       new MessageButton()
//         .setCustomId(`queue-sub-${interaction.user.id}`)
//         .setLabel('Under Review')
//         .setStyle('PRIMARY'),
//       new MessageButton()
//         .setCustomId(`accept-sub-${interaction.user.id}`)
//         .setLabel('Approve')
//         .setStyle('SUCCESS'),
//       new MessageButton()
//         .setCustomId(`deny-sub-${interaction.user.id}`)
//         .setLabel('Deny')
//         .setStyle('DANGER'),
//     );

//     const embedVerify = new MessageEmbed({ title: 'New Submission', fields: verifyEmbed, description: 'Please verify this submission' });
//     await verifyChannel.send({ embeds: [embedVerify], components: [row] });
//     interaction.reply({ embeds: [submitEmbedded], ephemeral: false });
//   }

// }