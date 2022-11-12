// DISCORD BOT 2
// BLACKJACK FUNCTIONS
// Created: 		11/12/22
// Last modified:	11/12/22


/* Node modules */
const { channel } = require('diagnostics_channel');
const Discord = require('discord.js');                                                                  // Discord JS
const Jimp = require('jimp');                                                                           // File manipulation                

/* External JSONs */
const config = require('./jsons/config.json'); 															// Generic config declaration in event other things are added

/* External JavaScript files */
const money = require('./money.js');																	// Money stuff


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


// Bet is already checked against user balance
// Additional check(s) may be needed for further bets
async function playBlackjack(msg, args, client, bet)
{
    const thread = await msg.channel.threads.create
    ({
        name: 'BLACKJACK (' + msg.author.tag + ')',
        autoArchiveDuration: 60,
        reason: 'A new thread for your game'
    });

    await thread.join();
    await thread.members.add(msg.author.id);
    // await thread.send("Test message!");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*CARD FUNCTIONS*/


// use Node Jimp to add value to card(s) and resize
//


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
	playBlackjack
}