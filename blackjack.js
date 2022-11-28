// DISCORD BOT 2
// BLACKJACK FUNCTIONS
// Created: 		11/12/22
// Last modified:	11/28/22


/* Node modules */
const Discord = require('discord.js');                                                                  // Discord JS
const Jimp = require('jimp');                                                                           // File manipulation                
const JoinImages = require('join-images');                                                              // Image joining

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

    // Probably a better way to do this, however, fuck you
    var spade   = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a']; 
    var club    = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    var diamond = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];
    var heart   = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'];

    var pHand = [];                                                                                     // Player hand
    var bHand = [];                                                                                     // Bot hand

    var cancelled = false;
    var ended = false;
    var reminders = 0;

    // First deal
    bHand.push(drawCard(spade, club, diamond, heart));                                                  // Initial bot hand
    bHand.push(drawCard(spade, club, diamond, heart));
    pHand.push(drawCard(spade, club, diamond, heart));                                                  // Initial player hand
    pHand.push(drawCard(spade, club, diamond, heart));

    // TODO: Get hand as single image using handImage

    var fBotHand = new Discord.MessageEmbed()
        .setColor(0x934459)
        .setTitle('Curiosity\'s Hand');

    var fPlayerHand = new Discord.MessageEmbed()
        .setColor(0x7C9759)
        .setTitle('Your Hand');

    const filter = m => m.author.tag === msg.author.tag;                                                // Filters messages in thread to original author
    // Needs to be able to get messages after x amount of time/messages
    // then parse the given responses for a valid reply--looping back
    // around if a valid response isn't given.
    do
    {
        await thread.awaitMessages({ filter, max: 1, time: 60_000, errors: ['time'] })

        .then (collected =>
        {
            reminders = 0;
            var keyArr = Array.from(collected.keys());                                                  // Gets key(s) (message ID) from message collection 
            var message = collected.get(keyArr[0]).content;                                             // Gets message from collection based on message ID

            // TODO: Everything
        })
        
        .catch (collected =>                                                                            // Timeout/catch reached
        {
            reminders += 1;
            thread.send("Awaiting response... (" + reminders + "/3)");
            if (reminders >= 3) cancelled = true, ended = true;                                         // After three reminders, abort the game
        });
    }
    while(!ended);

    // IMPORTANT NOTE !!!
    //
    // Need to re-check balance prior to any resolution, as the game could
    // take place alongside additional betting and allow the user to spend
    // money they don't have
    //
    // Alternatively, if this is allowed to happen and the user loses, the
    // subsequent negative account balance may be punishment enough...

    if (cancelled)
    {
        // TODO: Code to eat money here
        // (Prevents cheating if losing)

        await thread.delete();
        return msg.reply("Timeout/error reached, ending game...");
    }

    await thread.setArchived(true);
    await thread.setLocked(true);
    
    return msg.reply("Game finished! (Placeholder)");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*GAME FUNCTIONS*/


//


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*CARD FUNCTIONS*/


// TODO: use Node Jimp to add value to card(s) and resize
function genCard(card)
{
    return;
}

// TODO: use Node join-images to get imaged from genCard and output a single image
function handImage()
{
    // JoinImages.joinImages()
    return;
}

// Gets a card from the available options
function drawCard(spade, club, diamond, heart)
{
    var selectedCard = [];
    var num = randFromZero(3);
    switch (num)
    {
        case 0:
            selectedCard[0] = "spade";
            var indx = randFromZero(spade.length);
            selectedCard[1] = spade[indx];
            spade.splice(indx, 1);
            break;
        case 1:
            selectedCard[0] = "club";
            var indx = randFromZero(club.length);
            selectedCard[1] = club[indx];
            club.splice(indx, 1);
            break;
        case 2:
            selectedCard[0] = "diamond";
            var indx = randFromZero(diamond.length);
            selectedCard[1] = diamond[indx];
            diamond.splice(indx, 1);
            break;
        case 3:
            selectedCard[0] = "heart";
            var indx = randFromZero(heart.length);
            selectedCard[1] = heart[indx];
            heart.splice(indx, 1);
            break;
    }
    return selectedCard;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MISC FUNCTIONS*/


function randFromZero(max)
{
    var num = Math.round(Math.random() * max);
    if (num > max) num = max;
    return num;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
	playBlackjack
}