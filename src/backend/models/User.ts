import { User } from "../types/User";
import { db } from "../db.js";
import { OkPacket, RowDataPacket } from "mysql2";
import e from "express";

export const createUser = (user: User, callback: Function) => {
  checkIfRSNExists(user.rsn, (err: Error, result: boolean)=> {
    if (err) {
      callback(err);
    } else if (!result){
      const queryString = "INSERT INTO rsn \
                          (discordid, discordname, rsn, valid) \
                        VALUES (?, ?, ?, ?) \
                        ON DUPLICATE KEY UPDATE \
                          discordname=VALUES(discordname), \
                          rsn=VALUES(rsn), \
                          valid=VALUES(valid) \
                        "
      db.query(
        queryString,
        [user.discordID, user.discordname, user.rsn, user.valid],
        (err, result) => {
          if (err) {callback(err)};
          if (result){
            callback(null, result);
          }
          
        }
      );
    } else {
      const userExists = new Error('User already exsits and is verified');
      userExists.name = 'userExist';
      callback(userExists);
    }
  });
  

  
};

export const checkIfRSNExists = (rsn: string, callback: Function) => {
  const queryString = "SELECT *\
                       FROM rsn \
                       WHERE rsn=?";

  db.query(
    queryString,
    [rsn],
    (err, result) => {
      if (err) {callback(err)};
      if (result){
        const row = (<RowDataPacket> result)[0];
        if (!row) {
          callback(null, false);
        } else {
          if (row.valid){
            callback(null,true);
          } else {
            callback(null, false);
          }
        }
      }
      
    }
  );
};

export const verifyUser = (discordID: string, valid:boolean, callback: Function) => {
  const queryString = "UPDATE rsn \
                       SET \
                        valid=? \
                       WHERE discordid=?"

  db.query(
    queryString,
    [valid, discordID],
    (err, result) => {
      if (err) {callback(err)};
      if (result){
        callback(null, result);
      }
      
    }
  );
};

export const getUser = (discordID: string, callback: Function) => {
  const queryString = "SELECT *\
                       FROM rsn \
                       WHERE discordid=?";

  db.query(
    queryString,
    [discordID],
    (err, result) => {
      if (err) {callback(err)};
      if (result){
        const row = (<RowDataPacket> result)[0];
        const user: User = {
          discordID: row.discordid,
          discordname: row.discordname,
          rsn: row.rsn,
          valid: row.valid,
        }
        callback(null, user);
      }
      
    }
  );
}