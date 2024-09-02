import { BingoCache, BingoCard, BingoItem } from '../../types/Bingo';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddbClient  = new DynamoDBClient({ region: 'us-west-2' });

let bingoCache: BingoCache = {};

export const setupTeam = async (card: BingoCard) => {
  let ddbItem = {
    team_id: { S: card.teamid },
    card_id: { S: card.cardid },
  };
  card.card.forEach((row: BingoItem[], index: number) => {
    ddbItem[`row_${index}`] = { L: row.map((item: BingoItem) => ({ M: { dropid: { S: item.dropid }, dropAr: { L: item.value.map((value: number) => ({ N: value })) } } })) };
  });
  const newTeamPut = new PutItemCommand({
    TableName:'bingoTable',
    Item:ddbItem,
  });
  try {
    const result = await ddbClient.send(newTeamPut);
    bingoCache[`${card.teamid}-${card.cardid}`] = card;
    return { result, err: null };
  } catch (err) {
    console.error(err);
    return { result: null, err };
  }
};

const resyncTeam = async (cardid: string, teamid: string) => {
  const getCard = new GetItemCommand({
    TableName:'bingoTable',
    Key:{
      team_id: { S: teamid },
      card_id: { S: cardid },
    },
  });
  try {
    const result = await ddbClient.send(getCard);
    if (result.Item) {
      let card = result.Item;
      let newCard: BingoCard = {
        teamid: card.team_id.S!,
        cardid: card.card_id.S!,
        card: [[], [], [], [], []],
      };
      for (const key in card) {
        if (key.startsWith('row_')) {
          const index = parseInt(key.split('_')[1]);
          newCard.card[index] = card[key].L!.map((row: any) => {
            return {
              dropid: row.M.dropid.S!,
              value: row.M.dropAr.L!.map((value: any) => parseInt(value.N!)),
            };
          });
        }
      }
      bingoCache[`${teamid}-${cardid}`] = newCard;
      return { result, err: null };
    } else {
      const noCard = new Error('Card doesn\'t exist');
      noCard.name = 'noCard';
      return { result: null, err: noCard };
    }
  } catch (err) {
    console.error(err);
    return { result: null, err };
  }
};

export const getCard = async (cardid: string, teamid:string) => {
  if (!bingoCache[`${teamid}-${cardid}`]) {
    await resyncTeam(cardid, teamid);
  }
  return bingoCache[`${teamid}-${cardid}`];
};

export const insertDrop = async (cardid: string, teamid: string, location: number[], dropLocation: number, newValue: number) => {
  let card = await getCard(cardid, teamid);

  const newRow = card!.card[location[0]][location[1]].value;
  newRow[dropLocation] = newValue;

  const updateCard = new UpdateItemCommand({
    TableName:'bingoTable',
    Key:{
      team_id: { S: teamid },
      card_id: { S: cardid },
    },
    ExpressionAttributeNames: { '#row': `row_${location[0]}` },
    ExpressionAttributeValues: { ':dropUpdate': { N: newValue.toString() } },
    UpdateExpression: `SET #row[${location[1]}].dropAr[${dropLocation}] = :dropUpdate`,
    ReturnValues:'UPDATED_NEW',
  });

  try {
    const result = await ddbClient.send(updateCard);
    card!.card[location[0]][location[1]].value[dropLocation] = newValue;
    bingoCache[`${teamid}-${cardid}`] = card;
    return { result, err: null };
  } catch (err) {
    console.error(err);
    return { result: null, err };
  }
};