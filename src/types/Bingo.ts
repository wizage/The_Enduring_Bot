export interface BingoCard {
  items: [BingoItem],
  name: String
}

export interface BingoItem {
  itemName: string,
  submitter?: string,
  attachedImage?: string,
  submitted?:boolean,
  validated?:boolean,
}

export interface BingoGame {
  cards:[BingoCard]
  title: String
  teams: [Team]
}

export interface Team {
  name: string
  role?: string
  discordNames?: [string]
  maxSize: number
}