// DISCORD BOT 2
// MONEY FUNCTIONS
// Created: 		5/16/22
// Last modified:	11/21/22

/*
	Requirement note: Access methods need to be dispached from both
	index.js & stock.js via commands related to !balance as well as
	!stock, etc.
*/

/* Node modules */
const Discord = require('discord.js');
const PG = require('pg');																				// PostgreSQL

/* External JSONs */
const config = require('./jsons/config.json'); 															// Generic config declaration in event other things are added

/* Misc */
const cooldown = 43200000;																				// 12 hours in milliseconds


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


function handleMoney(msg, args, client, bot)
{
	switch(args[0])																						// For access coming from files outside index.js
	{
		case 'send':
			if (!args[1] || !args[2])																	// Checks that all arguments are provided
			{
				msg.reply("Missing arguments for '!points send'.\n" + 
					"Example usage: '!points send 10 @person'");
			}
			else
			{
				if(isNaN(args[1]) || Number.parseFloat(args[1]) <= 0)									// args[1] must be a number > 0
				{
					msg.reply("Points to be sent should be a number > 0.");
					return;
				}
				var recUser = getUserFromMention(args[2], bot);											// Receiving user
				var senUser = msg.author;																// Sending user
				if(!recUser)																			// Checks user was returned
				{
					msg.reply("The user you listed was unable to be found.");
					return;
				}
				transferMoney(senUser, recUser, Number.parseFloat(args[1]), client, msg)				// Handler for points transfer
			}
			break;


		case 'scores':
			displayTop(msg, client);
			break;

		default:
			if (args[0]) 
			{
				msg.reply("I'm not sure what to do with that command!");
				msg.channel.send("Try using '!points' to see the available commands.");
			}
			else
			{
				var helpEmbed = new Discord.MessageEmbed()
	                .setColor('#d4d977')
	                .setTitle('Points Commands')
	                .addFields(
	                	{name: "!points send", value: "Send someone points.\nUsage: '!points send <#> <@user>'"},
	                	{name: "!points scores", value: "View the top point scores.\nUsage: '!points scores'"}
	                );
	            msg.channel.send({ embeds: [helpEmbed] });
			}
			break;
	}
}

function balCheck(msg, args, client)
{
	checkBalance(msg, args, client);
}

function welfare(msg, args, client)
{
	assignWelfare(msg, args, client);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*BALANCE CHECKER FUNCTIONS*/


function checkBalance(msg, args, client)
{
	var author = msg.author.tag;
	var query = { text: "SELECT money FROM current_balance WHERE name = '"+ author +"'" };

	var resVal;																							// Value being sought

	/* Query to the database */
	client.query(query, (err, res) =>
	{
		if (err)
		{
			console.log("/// Error with checkbalance query\n" + err.stack);
			resVal = undefined;																			// Error during db query
		}
		else
		{
			if (res.rows[0] == undefined) resVal = null;												// User not found in db
			else resVal = res.rows[0].money;
		}

		/* Handling once result is determined */
		switch (resVal)
		{
			case null:
				msg.reply("You don't appear to have an account! Let me make one for you now...");
				createBalance(client, msg.author.tag, msg, args);
				return;

			case undefined:
				msg.reply("An unexpected error occurred while trying to access your balance!");
				return;

			default:
				var embed = new Discord.MessageEmbed()
					.setColor('#d4d977')
					.setTitle(msg.author.tag)
					.addFields({ name: 'Account points:', value: '' + resVal})
					.setThumbnail(msg.author.displayAvatarURL());
				msg.channel.send({ embeds: [embed] });
				return;
		}
	});
}

function createBalance(client, tag, msg, args)
{
	var query = { text: "INSERT INTO current_balance (name, money, cooldown) VALUES ('"+ tag +"', 50.00, 0)" };

	/* Query to the database */
	client.query(query, (err, res) =>
	{
		if (err)
		{
			console.log("/// Error attempting to create account!\n" + err.stack);
			msg.channel.send("An unexpected error occurred trying to create your account!");
		}
		else
		{
			console.log("> New balance created for " + tag);
			balCheck(msg, args, client);
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*BALANCE ADJUSTER FUNCTIONS*/


/* !! Assumes tag exists within database !! */
function adjustBalance(client, tag, changeAmt, updateCooldown)
{
	var query = "";
	if (updateCooldown) // Updates cooldown value to now
	{
		query =
		{ 
			text: "UPDATE current_balance SET money = money + " + Number.parseFloat(changeAmt) + ", cooldown = " + 
				Number.parseFloat(Date.now()) + " WHERE name = '"+ tag +"'"
		};
	}
	else
	{
		query =
		{
			text: "UPDATE current_balance SET money = money + " + Number.parseFloat(changeAmt) + " WHERE name = '"+ tag +"'"
		};
	}
	/* Query to the database */
	client.query(query, (err, res) =>
	{
		if (err) console.log("/// Error updating balance\n" + err.stack);
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*WELFARE HANDLER FUNCTIONS*/


function assignWelfare(msg, args, client)
{
	var author = msg.author.tag;
	var query = { text: "SELECT cooldown FROM current_balance WHERE name = '"+ author +"'" };

	var resVal;																							// Value being sought

	/* Query to the database */
	client.query(query, (err, res) =>
	{
		if (err)
		{
			console.log("/// Error with cooldown query\n" + err.stack);
			resVal = undefined;																			// Error during db query
		}
		else
		{
			if (res.rows[0] == undefined) resVal = null;												// User not found in db
			else resVal = res.rows[0].cooldown;
		}

		/* Handling once result is determined */
		switch (resVal)
		{
			case null:
				msg.reply("You don't appear to have an account! Use '!balance' to create one");
				return;

			case undefined:
				msg.reply("An unexpected error occurred while trying to access your information!");
				return;

			default:
				if ((parseInt(resVal) + cooldown) <= Date.now())
				{
					adjustBalance(client, msg.author.tag, 50, true);
					msg.reply("50 points has been added to your account!");
				}
				else
					msg.reply("You need to wait 12 hours between uses of '!welfare'\n" +
							  "Time remaining: " + msToTime((parseInt(resVal) + cooldown) - Date.now()));
				return;
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MONEY TRANSFER FUNCTIONS*/


function transferMoney(sender, receiver, amt, client, msg)
{
	var s = sender.tag;
	var r = receiver.tag;

	var query1 = { text: "SELECT money FROM current_balance WHERE name = '"+ s +"'" };
	var query2 = { text: "SELECT money FROM current_balance WHERE name = '"+ r +"'" };

	/* Query 1 to the database */
	client.query(query1, (err, res) =>
	{
		if (err)
		{
			console.log("/// Error with transfer query 1\n" + err.stack);
			msg.reply("Unexpected error encountered while trying to send money!");
			return;
		}
		else
		{
			if (res.rows[0] == undefined)																// User not in db
			{
				msg.reply("You need to have an account to send points!");
				msg.channel.send("Use '!balance' to open one.");
				return;
			}
			else if (res.rows[0].money < amt)															// Invalid amount of money
			{
				msg.reply("You can't send more points than you have!");
				return;
			}

			/* Query 2 to the database */
			client.query(query2, (err, res) =>
			{
				if (err)
				{
					console.log("/// Error with transfer query 2\n" + err.stack);
					msg.reply("Unexpected error encountered while trying to send points!");
					return;
				}
				else
				{
					if (res.rows[0] == undefined)														// User not in db
					{
						msg.reply("The user you want to send points to needs to have an account!");
						return;
					}

					adjustBalance(client, s, -(amt), false);											// Remove money from sender
					adjustBalance(client, r, amt, false);												// Give money to receiver

					msg.reply(amt + " points transferred to " + r);
				}
			});
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*EXTRA FUNCTIONS*/


function msToTime(duration)
{
	var milliseconds = parseInt((duration % 1000) / 100),
	seconds = Math.floor((duration / 1000) % 60),
	minutes = Math.floor((duration / (1000 * 60)) % 60),
	hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function getUserFromMention(mention, bot)
{
	if (!mention) return;
	if (mention.startsWith('<@') && mention.endsWith('>'))
	{
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) mention = mention.slice(1);

		return bot.users.cache.get(mention);
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*LEADERBOARD FUNCTIONS*/


function displayTop(msg, client)
{
	var query = { text: "SELECT name, money FROM current_balance ORDER BY money DESC" };
	/* Query to the database */
	client.query(query, (err, res) => 
	{
		if (err)
		{
			console.log("/// Error getting top scores");
			msg.channel.reply("An unexpected error occurred while trying to check the scores!");
			return;
		}
		else
		{
			var embed = new Discord.MessageEmbed();
			var i;

			embed.setColor('#d4d977');
			for (var i = 1; i < 11; i++)
			{
				embed.addFields
				({
					name: '#' + i + ' - ' + res.rows[i-1].name,
					value: res.rows[i-1].money + ' points'
				});
				if (res.rows[i] == undefined) break;
			}
			embed.setTitle('Top ' + i + ' Scores');
			msg.channel.send({ embeds: [embed] });
		}
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
	handleMoney,
	balCheck,
	welfare,
	adjustBalance
}