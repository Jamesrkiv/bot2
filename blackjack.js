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
    return; // Temp

    const thread = await msg.channel.threads.create
    ({
        name: 'BLACKJACK (' + msg.author.tag + ')',
        autoArchiveDuration: 60,
        reason: 'A new thread for your game'
    });

    await thread.join();
    await thread.members.add(msg.author.id);
    // await thread.send("Test message!");

    // Probably a better way to do this, however, fuck you
    var spade   = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a']; 
    var club    = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    var diamond = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    var heart   = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];

    const filter = m => m.author.tag === msg.author.tag;
    await thread.awaitMessages({ filter, max: 3, time: 10_000, errors: ['time'] })
    .then (collected => 
        console.log(collected)
    )
    .catch (collected => 
        console.log(collected)
    );

    await thread.delete();
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