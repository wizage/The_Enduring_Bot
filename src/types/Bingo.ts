
export interface BingoItem {
  dropid: string,
  value: any[],
}

export interface BingoCard {
  cardid: string,
  teamid: string,
  card: BingoItem[][]
}

export interface BingoCache {
  [key: string]: BingoCard | null
}