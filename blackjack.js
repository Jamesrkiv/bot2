// DISCORD BOT 2
// BLACKJACK FUNCTIONS
// Created: 		11/12/22
// Last modified:	11/12/22


/* Node modules */
const Discord = require('discord.js');
const { MessageAttachment, Message } = require('discord.js');                                           // Discord JS

/* External JSONs */
const config = require('./jsons/config.json'); 															// Generic config declaration in event other things are added

/* External JavaScript files */
const money = require('./money.js');																	// Money stuff


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


// Bet is already checked against user balance
// Additional check(s) may be needed for further bets
function playBlackjack(msg, args, client, bet)
{
    //
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
	playBlackjack
}