// DISCORD BOT 2
// CASINO FUNCTIONS
// Created: 		5/17/22
// Last modified:	11/7/22


/* Node modules */
const Discord = require('discord.js');
const PG = require('pg');																				// PostgreSQL
const path = require("path");                                                                           // Path variable
const fs = require('fs');                                                                               // File reading/writing (mostly writing)
const { MessageAttachment, Message } = require('discord.js');                                           // Discord JS
const Jimp = require('jimp');

/* External JSONs */
const config = require('./jsons/config.json'); 															// Generic config declaration in event other things are added

/* External JavaScript files */
const money = require('./money.js');																	// Money stuff
const { Canvas, Image, jpegVersion } = require('canvas');
const { fstat } = require('fs');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


function casinoHelp(msg)
{
	var helpEmbed = new Discord.MessageEmbed()
        .setColor('#e8afda')
        .setTitle('Casino Commands')
        .addFields(
            {name: "!slots", value: "Roll the slots!"
									+"\nUsage: '!slots <bet>'"},
            {name: "!flip", value: "Flip a coin and try your luck!"
									+"\nUsage: '!flip <bet> <heads/tails>'"},
			{name: "!range", value: "Guess a number and try to get within 100 of the target."
									+"\n±0: x100"
									+"\n±50: x20"
									+"\n±100: x10"
									+"\nUsage: '!range <bet> <guess 0-999>'"}
        );
    msg.channel.send({ embeds: [helpEmbed] });
}

function handleCasino(msg, args, client, game)
{
	/* Number format check */ 
	if (isNaN(args[0]) || Number.parseFloat(args[0]) <= 0)												// Checks user gives number > 0
	{
		msg.reply("You need to provide a valid number > 0 to gamble!");
		return;
	}

	/* Balance check before gamble */
	var checkQuery = { text: "SELECT money FROM current_balance WHERE name = '"+ msg.author.tag +"'" };
	client.query(checkQuery, (err, res) =>
	{
		if (err)
		{
			console.log("/// Error checking balance for casino!");
			msg.reply("An unexpected error occurred while trying to check your balance!");
			return;
		}
		else
		{
			if (res.rows[0] == undefined)																// User not found in db
			{
				msg.reply("You need to have an account to gamble!");
				msg.channel.send("Use '!balance' to open one.");
				return;
			}

			var balance = res.rows[0].money;
			var gambleAmt = Number.parseFloat(args[0]);
			if (balance < gambleAmt)																	// Checks user actually has money
			{
				msg.reply("You can't bet more than you have!");
				return;
			}

			/* Casino game */
			switch(game)
			{
				case "slots":
					slotsGame(msg, gambleAmt, client);
					break;
				case "flip":
					coinFlip(msg, args, gambleAmt, client);
					break;
				case "range":
					if (!args[1] || isNaN(args[1]))
					{
						msg.reply("You need to guess a number to play the Range Game!");
						msg.channel.send("Try using !casino to see more instructions.");
						return;
					}
					rangeGame(msg, args, gambleAmt, args[1], client);
					break;
			}
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*SLOTS FUNCTIONS*/


function slotsGame(msg, bet, client)
{
	var num1 = Math.floor(Math.random() * 3) + 1;
	var num2 = Math.floor(Math.random() * 3) + 1;
	var num3 = Math.floor(Math.random() * 3) + 1;

	var resN = num1 + "" + num2 + "" + num3;
	var win = false;
	var mult = 1;

	if (resN === "333")	
	{
		if ((Math.floor(Math.random() * 20) + 1) < 16)													// Patented 'Fuck You (TM)' RNG algorithm
			resN = "222";
	}

	switch(resN)
	{
		case "111":
		case "222":
			win = true;
			mult = 6;
			break;
		case "333":
			win = true;
			mult = 40;
			break;
	}

	var winnings = 0;
	if (win) winnings = (bet * mult) - bet;																// Calculate winnings
	else winnings = -(bet);

	/* Report results */
	var ttl = "";
	if (win) ttl = "You won " + winnings + " points!";
	else ttl = "You lost " + bet + " points."

	/* Get path & embed */
	var pathn = "casino/slots/" + resN + ".png";
	var embed = new Discord.MessageEmbed()
		.setColor('#e8afda')
		.setTitle(ttl)
		.setImage('attachment://' + pathn);

	/* Adjust balance & send image */
	money.adjustBalance(client, msg.author.tag, winnings, false);
	msg.channel.send({ embeds: [embed], files: ['./bot2/' + pathn] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*COINFLIP FUNCTIONS*/


function coinFlip(msg, args, bet, client)
{
	if (!args[1] || (args[1].toLowerCase() !== "heads" && args[1].toLowerCase() !== "tails"))
	{
		msg.reply("You need to call either heads or tails!");
		return;
	}
	var guess = args[1].toLowerCase();
	var resul = (Math.floor(Math.random() * 2) + 1 === 2) ? "heads" : "tails";
	var win = false;

	/* Determine result */
	if (guess === resul) win = true;
	var ttl = (win) ? "You win! +" + bet + " points" : "You lose.";

	/* Get path & embed */
	var pathn = "casino/coin/" + resul + ".png";
	var embed = new Discord.MessageEmbed()
		.setColor('#e8afda')
		.setTitle(ttl)
		.setImage('attachment://' + pathn);

	/* Adjust balance & send image */
	var winnings = (win) ? bet : -(bet);
	money.adjustBalance(client, msg.author.tag, winnings, false);
	msg.channel.send({ embeds: [embed], files: ['./bot2/' + pathn] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*RANGE-GAME FUNCTIONS*/


async function rangeGame(msg, args, bet, guess, client)
{
	if (guess < 0 || guess > 999)																		// Ensures guess is within range
	{
		msg.reply("Your guess must be within the range of 0 - 999");
		return;
	}
	const fileMapping =
	{
		"bigwin"	: "WIN_MID",
		"winl"		: "WIN_L_Y",
		"winr"		: "WIN_R_Y",
		"swinl" 	: "WIN_L_R",
		"swinr"		: "WIN_R_R",
		"losel"		: "LOSE_L",
		"loser"		: "LOSE_R"
	}

	/* Variables */
	var target = Math.floor(Math.random() * 999);														// Generates random number
	var win = false;																					// Win boolean
	var winnings = 0;																					// Amount of money won
	var file;																							// Image file name

	/* Determines outcome of game */
	if (guess == target)																				// Guess on target
	{
		winnings = 100 * bet;
		win = true;
		file = fileMapping["bigwin"];
	}
	else if ((target - 100) <= guess && guess <= (target + 100))
	{
		if ((target - 50) <= guess && guess <= (target + 50))											// Guess within 50
		{
			winnings = 20 * bet;
			win = true;
			file = (guess < target) ? fileMapping["winl"] : fileMapping["winr"];
		}
		else																							// Guess within 100
		{
			winnings = 10 * bet;
			win = true;
			file = (guess < target) ? fileMapping["swinl"] : fileMapping["swinr"];
		}
	}
	else																								// Loss
	{
		winnings = -(bet);
		file = (guess < target) ? fileMapping["losel"] : fileMapping["loser"];
	}

	/* Image manipulation */
	const image = await Jimp.read('./bot2/casino/range/' + file + ".jpg");								// Get image from file
	const font1 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);										// Target font
	const font2 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);											// Guess font
	image.print(font1, 65, 50, "" + target);															// Adds target to image
	image.print(font2, 400, 116, "" + guess);															// Adds guess to image
	var img = image.getBuffer(Jimp.MIME_JPEG, (err, buffer) => 											// Buffers image
	{
		var msgTxt = (win) ? winnings + " points earned" : bet + " points lost";
		var embed = new Discord.MessageEmbed()
			.setColor('#578bbd')
			.setTitle(msgTxt);
		msg.channel.send({embeds: [embed], files: [buffer]});
	});
	money.adjustBalance(client, msg.author.tag, winnings, false);										// Adjust user balance
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
	casinoHelp,
	handleCasino
}