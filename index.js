// DISCORD BOT 2
//
// Created: 		3/6/22
// Last modified:	11/12/22


/* Node modules */
const Discord = require('discord.js');																	// Discord.js
const PG = require('pg');																				// PostgreSQL

/* External JSONs */
const { prefix , token } = require('./jsons/config.json');											    // Gets prefix/token from config
const config = require('./jsons/config.json'); 														    // Generic config declaration in event other things are added

/* External JavaScript files */
const music =  require('./music.js');                                                                   // JavaScript file for music stuff
const stock =  require('./stock.js');																	// JavaScript file for stocks stuff
const money =  require('./money.js');																	// JavaScript file for money stuff
const casino = require('./casino.js');                                                                  // JavaScript file for casino stuff

/* Discord bot client */
const bot = new Discord.Client({ intents: [ Discord.Intents.FLAGS.GUILDS,
                                            Discord.Intents.FLAGS.GUILD_VOICE_STATES,
                                            Discord.Intents.FLAGS.GUILD_MESSAGES,
                                            Discord.Intents.FLAGS.GUILD_MEMBERS,
                                            Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
                                            Discord.Intents.FLAGS.DIRECT_MESSAGES ] });

/* PostgreSQL database client */
const client = new PG.Client(
{
	user: 'postgres',
	host: '127.0.0.1',
	database: 'stonksdb',
	password: '123',
	port: 5432
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*DATABASE*/


client.connect();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*CONSOLE LISTENER*/


var chn = "707755809894957138";                                                                         // Defaults to '#curiosity' of 'Bot Test Server'
let y = process.openStdin()                                                                             // Standard input for process window (cmd)
y.addListener("data", res =>                                                                            // Listener for data input
{
    let x = res.toString().trim().split(" ");                                                           // Input as array
    if (x[0] === "cd") chn = x[1];                                                                      // Looks for cd to indicate change in active channel
    else bot.channels.cache.get(chn).send(x.join(" "));                                                 // Sends input w/in current channel
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*ONCE READY*/


bot.on('ready', () =>																					// Sends message once online
{
    console.log('\n===================\nThis bot is online!\n===================');
    bot.user.setActivity('the stars', { type: 'WATCHING' });
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*REJECTIONS*/


process.on('unhandledRejection', error =>                                                               // Catch unhandled rejections
{
    if (error.message.split(" ")[3] == "bulk")                                                          // Error handling for purge & DiscordAPI
    {
        var channel = error.path.split("/")[2];                                                         // Channel creating error
        bot.channels.cache.get(channel).send("Cannot delete messages 14 days old or greater!");
    }
    else
    {
        console.log('/// Unhandled rejection');
        console.log(error);
    }
});

process.on("multipleResolves", (type, promise, reason) =>                                               // Catch duplicate resolves (for connection in music.js)
{
    if (reason.toLocaleString() === "Error: Cannot perform IP discovery - socket closed") return;
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*CHAT-RELATED ACTIONS*/


bot.on('messageCreate', msg=>                                                                           // Called whenever a message is sent
{
    if(msg.author.bot) return;																			// Stops if message is sent by the bot

    let msgContent = msg.content.toLowerCase();															// Message as sent by user
    if(!msg.content.startsWith(prefix)) return;															// Detects prefix
    const args = msg.content.slice(prefix.length).split(' ');											// Formats command for reading
    const command = args.shift().toLowerCase();															// ^

    if (msg.guild)																						// Only allows commands w/in server
	{ 
        switch(command)
        {
            // MUSIC COMMAND
            case "m": 
                music.handleMusic(msg, args);                                                           // Offloads work to music.js
                break;

            // STOCK COMMAND
            case "stock":
                stock.handleStocks(msg, args, client);                                                  // Offloads work to stock.js
                break;

            // MONEY COMMAND
            case "points":
            	money.handleMoney(msg, args, client, bot);												// Offloads work to money.js
            	break;

            // BALANCE COMMAND
            case "balance":
            	money.balCheck(msg, args, client);														// Offloads work to money.js
            	break;

            // WELFARE COMMAND
            case "welfare":
            	money.welfare(msg, args, client);														// Offloads work to money.js
            	break;

            // CASINO COOMMAND
            case "casino":
                casino.casinoHelp(msg);                                                                 // Offloads work to casino.js
                break;

            // GAME COMMANDS
            case "flip":
            case "slots":
            case "range":
                casino.handleCasino(msg, args, client, command);                                        // Offloads work to casino.js
                break;

            // BLACKJACK COMMAND
            case "blackjack":
                casino.handleCasino(msg, args, client, "blackjack");                                    // Offloads work to casino.js
                break;

            // PURGE COMMAND
            case "purge":
                handlePurge(msg, args);                                                                 // Purge function
                break;
                
            // HELP COMMAND
            case "help":
                showHelp(msg);                                                                          // Help menu
                break;

            // DEFAULT REPLY
            default:
                msg.reply("I'm not sure what to do with that command!");
                msg.channel.send("You can use '!help' to view a list of commands you can use.");
                break;
        }
        console.log("> " + msg.author.tag + " called !" + command + " command in " + msg.guild.name);
	}
})


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*HELP FUNCTION*/


function showHelp(msg)                                                                                  // Function to display help menu
{
    var helpEmbed = new Discord.MessageEmbed()
        .setColor('#33B7A2')
        .setTitle('Bot Commands')
        .setThumbnail(msg.guild.iconURL())
        .addFields(
            {name: '!m', value: 'Access music commands'},
            {name: '!stock', value: 'Access stock-related commands'},
            {name: '!points', value: 'Access points-related commands'},
            {name: '!balance', value: 'Access your current account balance'},
            {name: '!welfare', value: 'Get +50 points every twelve hours'},
            {name: '!casino', value: 'View the available casino games'},
            {name: '!purge', value: 'Deletes set number of messages\n(Admin only)'}
        );
    msg.channel.send({ embeds: [helpEmbed] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*PURGE FUNCTIONS*/


function handlePurge(msg, args)                                                                         // Function to handle purging messages
{
    if (msg.member.roles.cache.some(role => role.name === config.adminRole))                            // Checks for admin role (presently BotKey)
    {
        var amount = null;

        if (!args[0])
            return msg.reply('Please specify how many messages should be deleted!');
        else
            amount = args[0];

        if (isNaN(amount)) 
            return msg.reply('The given parameter isn\'t a number!\nUsage: !purge #');
        else if (amount > 99 || amount < 1) 
            return msg.reply('You can only purge 1 to 99 messages at once');

        amount = parseInt(amount);                                                                      // Ensures int used
        purgeMsg(msg, amount + 1);                                                                      // Calls purge function
        return;
    }
    console.log("> Permission denied");
    return msg.reply('You don\'t have sufficient permissions to use that command!');
}

async function purgeMsg(msg, amt)                                                                       // Function to purge messages
{
    await msg.channel.messages.fetch({ limit: amt }).then(messages =>                                   // Fetches the messages
    { 
        msg.channel.bulkDelete(messages);                                                               // Deletes messages <14 days old
    });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


bot.login(token);