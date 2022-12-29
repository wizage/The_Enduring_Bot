import { Oyster, OysterSubmission } from "../types/Oyster";
import { DynamoDBClient, Get, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
const ddbClient  = new DynamoDBClient({ region: "us-west-2" });

let oyster_cache: Oyster;

export const getHiscores = async () => {

    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    let date_nz = new Date(nz_date_string);
    let hours = ("0" + date_nz.getHours()).slice(-2);
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
    let year = date_nz.getFullYear();

    if (oyster_cache && oyster_cache.monthDate === `${month}-${year}`){
        return oyster_cache.hiscore;
    } else {
        await createNewHiscore(`${month}-${year}`);
        return oyster_cache.hiscore;
    } 
}

export const addEntry = async (submission:OysterSubmission) => {
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "UTC" });
    let date_nz = new Date(nz_date_string);
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
    let year = date_nz.getFullYear();
    if (!oyster_cache){
        await createNewHiscore(`${month}-${year}`);
    }
    oyster_cache.hiscore.push(submission);
    oyster_cache.hiscore.sort(hiscoreSort);
    const updateHiscores = new UpdateItemCommand({
        TableName: 'oysterTable',
        Key: { monthDate: { S: `${month}-${year}` }},
        UpdateExpression:'set hiscore = :r_hiscore',
        ExpressionAttributeValues: { ':r_hiscore': { S: JSON.stringify(oyster_cache.hiscore) }},
      });
    const position = oyster_cache.hiscore.indexOf(submission)+1;

    try {
        const result = await ddbClient.send(updateHiscores);
        return {result, err: null, position};
    } catch (err) {
        console.error(err);
        return {result: null, err, position};
    }
}

const hiscoreSort = (a: OysterSubmission, b: OysterSubmission) => {
    if (a.value > b.value){
        return 1;
    } else {
        return -1;
    }
}

export const checkIfMonthExists = async (monthDate: string) => {
    const checkMonth = new GetItemCommand({
      TableName: 'oysterTable',
      Key: { monthDate: {S: monthDate}},
    });

    try {
      const result = await ddbClient.send(checkMonth);
      oyster_cache = {
        monthDate,
        hiscore: JSON.parse(result.Item!.hiscore.S!)
      };
      return {result, err: null};
    } catch (err) {
      console.error(err);
      return {result: null, err};
    }
  };


const createNewHiscore = async (monthDate:string) => {
    const results = await checkIfMonthExists(monthDate);
    if (results.err){
        const newHiscore = JSON.stringify([]);
    const addNewMonth = new PutItemCommand({
        TableName:'oysterTable',
        Item:{
          monthDate: {S: monthDate},
          hiscore: {S: newHiscore},
        }
      });
      try {
        const result = await ddbClient.send(addNewMonth);
        oyster_cache = {
            monthDate,
            hiscore: []
        };
        return { result, wrongCommand: false, err: null };
      } catch (err) {
        console.error(err);
        return ({ result: null,  wrongCommand: false, err });
      }
    } else {
        return (results);
    }
    
}