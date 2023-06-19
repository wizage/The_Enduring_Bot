import { ActionRowBuilder, CommandInteraction, EmbedBuilder, GuildMemberRoleManager, Interaction, ModalBuilder, ModalSubmitInteraction, Role, TextChannel, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Discord, ModalComponent, Slash, SlashGroup } from 'discordx';


@Discord()
@SlashGroup({ name: 'reaper', description: 'Commands for Reaper Weekend' })
export abstract class PVMSlash {

  private async addRole(interaction: Interaction, roleName: string) {
    let guild = await interaction.guild?.fetch();

    let role = guild?.roles.cache.find( (r: Role) => r.name == roleName);
    if (!role) {
      await guild?.roles.create({
        name: roleName,
      });
      role = guild?.roles.cache.find((r: Role) => r.name == roleName);
    }

    if (role) {
      (interaction.member!.roles as GuildMemberRoleManager).add(role);
    }
  }
  
  @Slash( { name: 'signup', description: 'Sign up for bosses you want to do' })
  @SlashGroup('reaper')
  async signUpReaper(
    interaction: CommandInteraction) {
    if (!interaction.member) {
      const embed = new EmbedBuilder({ title: 'Server Error', description: '❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n No \'interaction.member\' was found' });
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    const modalSignup = new ModalBuilder()
      .setTitle('Reaper Weekend Signup')
      .setCustomId('signup-modal');

    const rsnInput = new TextInputBuilder()
      .setCustomId('rsn')
      .setLabel('In Game Name')
      .setStyle(TextInputStyle.Short);
    
    const bossSoloInput = new TextInputBuilder()
      .setCustomId('neededSoloBosses')
      .setLabel('Please list the solo bosses you need:')
      .setStyle(TextInputStyle.Paragraph);
    const bossGroupInput = new TextInputBuilder()
      .setCustomId('neededGroupBosses')
      .setLabel('Please list the group bosses you need:')
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      rsnInput,
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      bossSoloInput,
    );
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      bossGroupInput,
    );
    

    modalSignup.addComponents(row1, row2, row3);
    interaction.showModal(modalSignup);
  }

  @Slash( { name: 'teacher', description: 'Sign up for bosses you want to do' })
  @SlashGroup('reaper')
  async teacherReaper(
    interaction: CommandInteraction) {
    if (!interaction.member) {
      const embed = new EmbedBuilder({ title: 'Server Error', description: '❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n No \'interaction.member\' was found' });
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    const modalSignup = new ModalBuilder()
      .setTitle('Reaper Weekend Teacher Signup')
      .setCustomId('teacher-modal');

    const rsnInput = new TextInputBuilder()
      .setCustomId('rsn')
      .setLabel('In Game Name')
      .setStyle(TextInputStyle.Short);
    
    const bossInput = new TextInputBuilder()
      .setCustomId('teachBosses')
      .setLabel('Please list what bosses you are willing to teach')
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      rsnInput,
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      bossInput,
    );
    

    modalSignup.addComponents(row1, row2);
    interaction.showModal(modalSignup);
  }
  // 1106465468132368444

  @ModalComponent({ id: 'signup-modal' })
  async SignUpForm(interaction: ModalSubmitInteraction): Promise<void> {
    const [rsnInput, bossSoloInput, bossGroupInput] = ['rsn', 'neededSoloBosses', 'neededGroupBosses'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );
    if (!interaction.member) {
      const embed = new EmbedBuilder({ title: 'Server Error', description: '❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n No \'interaction.member\' was found' });
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('**New Reaper/Boss Help**')
      .addFields([{ name:'RSN', value:rsnInput, inline: true }, { name:'Discord', value:`<@${interaction.member.user.id}>`, inline: true }, 
        { name:'Solo Bosses:', value:bossSoloInput }, { name:'Group Bosses:', value:bossGroupInput }, 
      ]);
    await this.addRole(interaction, 'Reaper Learner');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    let channelId = '';
    if (interaction.guildId === '932144876659822623') {
      channelId = '1106465468132368444';
    } else if (interaction.guildId === '198166521573408768') { // enduring
      channelId = '1111143622109315152';
    }
    let reaperSignupChannel = interaction.client.channels.cache.get(channelId) as TextChannel;
    await reaperSignupChannel.send({ embeds: [embed] });
    return;
  }

  @ModalComponent({ id: 'teacher-modal' })
  async TeachForm(interaction: ModalSubmitInteraction): Promise<void> {
    const [rsnInput, bossInput] = ['rsn', 'teachBosses'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );
    if (!interaction.member) {
      const embed = new EmbedBuilder({ title: 'Server Error', description: '❌ Error: Contact <@409181714821283840> if you see this with a screenshot ❌ \n \n No \'interaction.member\' was found' });
      interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('**New Teacher Submission**')
      .addFields([{ name:'RSN', value:rsnInput, inline: true }, { name:'Discord', value:`<@${interaction.member.user.id}>`, inline: true }, 
        { name:'Bosses Volunteered For:', value:bossInput }, 
      ]);
    await this.addRole(interaction, 'Reaper Teacher');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    let channelId = '';
    if (interaction.guildId === '932144876659822623') {
      channelId = '1106465468132368444';
    } else if (interaction.guildId === '198166521573408768') { // enduring
      channelId = '1111143593176993832';
    }
    let reaperSignupChannel = interaction.client.channels.cache.get(channelId) as TextChannel;
    await reaperSignupChannel.send({ embeds: [embed] });
    
    return;
  }
}