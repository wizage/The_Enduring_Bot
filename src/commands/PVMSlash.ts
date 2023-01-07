import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Slash} from "discordx";
import { EMOJI_VALUES } from "../constants/emojis.js";


@Discord()
export abstract class PVMSlash {
  @Slash( { name: 'pouches', description: 'Get current pouch configurations' })
  async pouchConfig(
  interaction: CommandInteraction) {
    const pouchSetup = new EmbedBuilder()
          .setTitle(`**Recommended Pouch Setup**`)
          .addFields([{ name:"__PvME Pouch Setup__", value:`
          ⬥ ${EMOJI_VALUES.graspingpouchblack} ${EMOJI_VALUES.bloodrune} ${EMOJI_VALUES.astralrune} ${EMOJI_VALUES.bodyrune} ${EMOJI_VALUES.firerune}
          ⬥ ${EMOJI_VALUES.graspingpouchblue} ${EMOJI_VALUES.deathrune} ${EMOJI_VALUES.earthrune} ${EMOJI_VALUES.lawrune} ${EMOJI_VALUES.cosmicrune}
          ⬥ ${EMOJI_VALUES.grapsingpouchpink} ${EMOJI_VALUES.chaosrune} ${EMOJI_VALUES.airrune} ${EMOJI_VALUES.waterrune} ${EMOJI_VALUES.soulrune}`},
          { name:"__PvME Pouch Setup__", value:`
          ⬥ General Magic ${EMOJI_VALUES.graspingpouchblack} ${EMOJI_VALUES.grapsingpouchpink} ${EMOJI_VALUES.graspingpouchblue}
          ⬥ Non-Magic ${EMOJI_VALUES.graspingpouchblack} ${EMOJI_VALUES.grapsingpouchpink} ${EMOJI_VALUES.graspingpouchblue}
          ⬥ Non-Magic (with ${EMOJI_VALUES.sbs} ${EMOJI_VALUES.smokecloud}) ${EMOJI_VALUES.graspingpouchblack} ${EMOJI_VALUES.grapsingpouchpink}
          ⬥ Normal Spellbook ${EMOJI_VALUES.graspingpouchblue}
          ⬥ Basic Ancients ${EMOJI_VALUES.graspingpouchblack} ${EMOJI_VALUES.graspingpouchblue}
          `},
          ])
    interaction.reply({ embeds: [pouchSetup] });
  }
}