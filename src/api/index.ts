import { channel, Channel } from "diagnostics_channel";
import * as express from "express";
import { client } from '../client/index.js';
import { TextChannel } from "discord.js"
export const apiRouter = express.Router();
        
apiRouter.get('/listChannels', (req, res) => {
   const ids = getChannelIDs()
   res.json(ids);
});

apiRouter.post('/postChannel', (req, res) => {
    console.log(req.body);
    if ( !req.body || !req.body.channelID || !req.body.message){
        console.log(req.body);
        res.json({error: "Parameters are not correct"});
    } else {
        const channel = client.channels.cache.get(req.body.channelID);
        if (channel) {
            (channel as TextChannel).send(req.body.message);
            res.json({sucess: true});
        } else {
            console.log('channel not found');
        }
        
    }
    
});

function getChannelIDs() 
{
  var dict: { [key:string]: any} = {};
  let guildManager = client.guilds.cache.map(guild => { return {  guild: guild, items: guild.channels.cache.values() }});
  for (const manager of guildManager)   
  {
      dict[manager.guild.id] = {name: manager.guild.name};
      for (const channels of manager.items){
        if (channels.type === 'GUILD_CATEGORY'){
            dict[manager.guild.id][channels.id] = { name: channels.name };
        } else if (channels.type === 'GUILD_TEXT' || channels.type == 'GUILD_VOICE') {
            if (channels.parentId){
                dict[manager.guild.id][channels.parentId][channels.id] = { name: channels.name };
            } else {
                dict[manager.guild.id][channels.id] = { name: channels.name };
            }
        }
      }
  }

  return dict;
}