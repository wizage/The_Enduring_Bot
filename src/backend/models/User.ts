import { User } from "../types/User";
import { DynamoDBClient, Get, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { userInfo } from "os";
import e from "express";
const ddbClient  = new DynamoDBClient({ region: "us-west-2" });


export const createUser = async (user: User) => {
  const rsnExists = await checkIfRSNExists(user.rsn);
  if (rsnExists.err){
    return { result:null, err:rsnExists.err };
  }
  if (rsnExists.result && rsnExists.result.Count! === 0){
    const addNewUser = new PutItemCommand({
      TableName:'userTable',
      Item:{
        discordId: {S: user.discordID},
        runescapeName: {S: user.rsn},
        valid: {BOOL: user.valid},
        discordName: { S:user.discordname }
      }
    });
    try {
      const result = await ddbClient.send(addNewUser);
      return { result, wrongCommand: false, err: null };
    } catch (err) {
      console.error(err);
      return ({ result: null,  wrongCommand: false, err });
    }
  } else if (rsnExists.result && rsnExists.result.Count! === 1){
    const resultItem = rsnExists.result.Items![0];
    const currentDiscordUser = resultItem["discordId"]["S"];
    if (currentDiscordUser === user.discordID){
      return {
        result: null,
        wrongCommand: true,
        err: null,
      }
    } else {
      const userExists = new Error(`User already exsits and is verified with the discord <@${currentDiscordUser}>`);
    
      return {
        result: null,
        wrongCommand: false,
        err: userExists,
      }
    }
    
  } else {
    const userExists = new Error('User already exsits and is verified');
    userExists.name = 'userExist';
    return {
      result: null,
      err: userExists,
    }
  }
  
};

export const checkIfRSNExists = async (rsn: string) => {
  const checkUser = new QueryCommand({
    TableName: 'userTable',
    IndexName: 'runescapeName',
    Limit:1,
    KeyConditionExpression:'runescapeName=:r_name',
    ExpressionAttributeValues:{
      ':r_name':{S: rsn}
    }
  });
  try {
    const result = await ddbClient.send(checkUser);
    return {result, err: null};
  } catch (err) {
    console.error(err);
    return {result: null, err};
  }
};

export const verifyUser = async (discordID: string, valid:boolean) => {
  const updateUser = new UpdateItemCommand({
    TableName: 'userTable',
    Key: { discordId: { S: discordID }},
    UpdateExpression:'set valid = :r_valid',
    ExpressionAttributeValues: { ':r_valid': { BOOL: valid }},
  });
  try {
    const result = await ddbClient.send(updateUser);
    return {result, err: null};
  } catch (err) {
    console.error(err);
    return {result: null, err};
  }
};

export const getUser = async (discordID: string) => {
  const getDiscordUser = new GetItemCommand({
    TableName: 'userTable',
    Key: { discordId: { S: discordID }},
  });
  try {
    const result = await ddbClient.send(getDiscordUser);
    if (result.Item){
      let dbUser: User = {
        discordID: result.Item['discordId'].S!,
        discordname: result.Item['discordName'].S!,
        rsn: result.Item['runescapeName'].S!,
        valid: result.Item['valid'].BOOL!
      };
      return { result:dbUser, err: null};
    } else{
      const noUser = new Error('User doesn\'t exist. Configure your rsn first.');
      noUser.name = 'noUser';
      return {
        result: null,
        err: noUser,
      }
    }
  } catch (err) {
    console.error(err);
    return {result: null, err};
  }
}