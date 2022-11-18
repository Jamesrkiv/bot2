// DISCORD BOT 2
// BLACKJACK FUNCTIONS
// Created: 		11/12/22
// Last modified:	11/18/22


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

    const filter = m => m.author.tag === msg.author.tag;                                                // Filters messages in thread to original author

    // Needs to be able to get messages after x amount of time/messages
    // then parse the given responses for a valid reply--looping back
    // around if a valid response isn't given.
    await thread.awaitMessages({ filter, max: 3, time: 10_000, errors: ['time'] })

    .then (collected =>                                                                                 // Max messages reached
    {
        var keyArr = Array.from(collected.keys());                                                      // Gets keys (message IDs) from message collection

        var messages = [];                                                                              // User responses array
        for (var i = 0; i < keyArr.length; i++) messages[i] = collected.get(keyArr[i]).content;         // Populates messages array with content from collected messages
        
        console.log("Done");
    })
    
    .catch (collected =>                                                                                // Timeout/catch reached
    {
        console.log("Caught");
    });

    await thread.delete();
    msg.channel.reply("Game finished! (Placeholder)");
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