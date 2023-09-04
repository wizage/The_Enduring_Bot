import { ClanMember } from 'runescape-api/lib/RuneScape';
export interface User {
  discordID: string,
  rsn: string,
  valid: boolean,
  discordname: string
}

export interface RankUps {
  clanny: ClanMember,
  newRank: string
}