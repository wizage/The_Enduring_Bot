export interface Oyster {
  monthDate: string,
  hiscore: OysterSubmission[]
}

export interface OysterSubmission {
  value: number,
  discordId: string,
  discordName: string,
  rsn?: string
  picture: string
}