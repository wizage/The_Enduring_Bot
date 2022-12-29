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
    console.log(year, month, hours)

    if (oyster_cache && oyster_cache.monthDate === `${month}-${year}`){
        return oyster_cache.hiscore;
    } else {
        createNewHiscore(`${month}-${year}`);
        return oyster_cache.hiscore;
    }
    
}

const createNewHiscore = async (monthDate:string) => {
    const newHiscore = JSON.stringify([]);
    const addNewMonth = new PutItemCommand({
        TableName:'oysterTable',
        Item:{
          monthDate: {S: monthDate},
          hiscores: {S: newHiscore},
        }
      });
      try {
        const result = await ddbClient.send(addNewMonth);
        oyster_cache.monthDate = monthDate;
        oyster_cache.hiscore = [];
        return { result, wrongCommand: false, err: null };
      } catch (err) {
        console.error(err);
        return ({ result: null,  wrongCommand: false, err });
      }
}