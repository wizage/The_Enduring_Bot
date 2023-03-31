import { Oyster, OysterSubmission } from '../../types/Oyster';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
const ddbClient  = new DynamoDBClient({ region: 'us-west-2' });

let oysterCache: Oyster;

const hiscoreSort = (a: OysterSubmission, b: OysterSubmission) => {
  if (a.value > b.value) {
    return 1;
  } else {
    return -1;
  }
};

export const checkIfMonthExists = async (monthDate: string) => {
  const checkMonth = new GetItemCommand({
    TableName: 'oysterTable',
    Key: { monthDate: { S: monthDate } },
  });

  try {
    const result = await ddbClient.send(checkMonth);
    oysterCache = {
      monthDate,
      hiscore: JSON.parse(result.Item!.hiscore.S!),
    };
    return { result, err: null };
  } catch (err) {
    return { result: null, err };
  }
};

const createNewHiscore = async (monthDate:string) => {
  const results = await checkIfMonthExists(monthDate);
  if (results.err) {
    const newHiscore = JSON.stringify([]);
    const addNewMonth = new PutItemCommand({
      TableName:'oysterTable',
      Item:{
        monthDate: { S: monthDate },
        hiscore: { S: newHiscore },
      },
    });
    try {
      const result = await ddbClient.send(addNewMonth);
      oysterCache = {
        monthDate,
        hiscore: [],
      };
      return { result, wrongCommand: false, err: null };
    } catch (err) {
      console.error(err);
      return ({ result: null,  wrongCommand: false, err });
    }
  } else {
    return (results);
  }
    
};

export const removeOysterEntry = async (location: number) => {
  let utcDateString = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  let dateUTC = new Date(utcDateString);
  let month = ('0' + (dateUTC.getMonth() + 1)).slice(-2);
  let year = dateUTC.getFullYear();
  if (!oysterCache) {
    await createNewHiscore(`${month}-${year}`);
  }
  const oldPost = oysterCache.hiscore[location - 1];
  oysterCache.hiscore.splice(location - 1, 1);
  oysterCache.hiscore.sort(hiscoreSort);
  const updateHiscores = new UpdateItemCommand({
    TableName: 'oysterTable',
    Key: { monthDate: { S: `${month}-${year}` } },
    UpdateExpression:'set hiscore = :r_hiscore',
    ExpressionAttributeValues: { ':r_hiscore': { S: JSON.stringify(oysterCache.hiscore) } },
  });

  try {
    const result = await ddbClient.send(updateHiscores);
    return { result, err: null, oldPost };
  } catch (err) {
    console.error(err);
    return { result: null, err, oldPost };
  }
};

export const getHiscores = async () => {

  let utcDateString = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  let dateUTC = new Date(utcDateString);
  let month = ('0' + (dateUTC.getMonth() + 1)).slice(-2);
  let year = dateUTC.getFullYear();

  if (oysterCache && oysterCache.monthDate === `${month}-${year}`) {
    return oysterCache.hiscore;
  } else {
    await createNewHiscore(`${month}-${year}`);
    return oysterCache.hiscore;
  } 
};

export const addEntry = async (submission:OysterSubmission) => {
  let utcDateString = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  let dateUTC = new Date(utcDateString);
  let month = ('0' + (dateUTC.getMonth() + 1)).slice(-2);
  let year = dateUTC.getFullYear();
  if (!oysterCache) {
    await createNewHiscore(`${month}-${year}`);
  } else if (oysterCache.monthDate !== `${month}-${year}`) {
    await createNewHiscore(`${month}-${year}`);
  }
  oysterCache.hiscore.push(submission);
  oysterCache.hiscore.sort(hiscoreSort);
  const updateHiscores = new UpdateItemCommand({
    TableName: 'oysterTable',
    Key: { monthDate: { S: `${month}-${year}` } },
    UpdateExpression:'set hiscore = :r_hiscore',
    ExpressionAttributeValues: { ':r_hiscore': { S: JSON.stringify(oysterCache.hiscore) } },
  });
  const position = oysterCache.hiscore.indexOf(submission) + 1;

  try {
    const result = await ddbClient.send(updateHiscores);
    return { result, err: null, position };
  } catch (err) {
    console.error(err);
    return { result: null, err, position };
  }
};