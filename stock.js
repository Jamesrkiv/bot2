// DISCORD BOT 2
// STOCK FUNCTIONS
// Created: 		3/27/22
// Last modified:	11/8/22


/* Node modules */
const Discord = require('discord.js');
const request = require('request');                                                                     // For Node.js requests
const fs = require('fs');                                                                               // File reading/writing (mostly writing)
const path = require("path");                                                                           // Path variable
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');                                           // Canvas
const { MessageAttachment, Message } = require('discord.js');                                           // Discord JS

/* External JSONs */
const config = require('./jsons/config.json');                                                          // Generic config declaration in event other things are added

/* External JavaScript files */
const money = require('./money.js');																	// Money stuff
const { update } = require('ytdl-getinfo');

/* Misc */
const width = 800;                                                                                      // Width of canvas
const height = 400;                                                                                     // Height of canvas
const cutoff = 30;                                                                                      // Number of historical values to be stored
const nameMapping =                                                                                     // I don't want to talk about it
{
    "biocon" : 0, "granules": 1, "drreddy": 2, "alkem": 3,
    "glaxo": 4, "auropharma": 5, "sunpharma": 6, "divislab": 7,
    "ipcalab": 8, "natcopharm": 9, "cipla": 10, "gland": 11,
    "pfizer": 12, "glenmark": 13, "sanofi": 14, "lauruslabs": 15,
    "lupin": 16, "zyduslife": 17, "abbotindia": 18, "torntpharm": 19
};
const names =                                                                                           // Stock names (0-19)
[
    "Biocon",
    "Granules",
    "DrReddy",
    "Alkem",
    "Glaxo",
    "Auropharma",
    "Sunpharma",
    "Divislab",
    "Ipcalab",
    "Natcopharm",
    "Cipla",
    "Gland",
    "Pfizer",
    "Glenmark",
    "Sanofi",
    "LaurusLabs",
    "Lupin",
    "ZydusLife",
    "Abbotindia",
    "Torntpharm"
];



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


async function handleStocks(msg, args, client)
{
    switch(args[0])
    {
        case "list":
            return handleExchange(msg, args, client, true);

        case "portfolio":
            return viewPortfolio(msg, client);

        case "get":
            if (!args[1]) return msg.reply("You need to specify a stock! See '!stock' for help");
            var id = null;
            for (var i = 0; i < 20; i++)
            {
                if (names[i].toLowerCase() == args[1].toLowerCase())
                {
                    id = i;
                    break;
                }
            }
            if (id == null) return msg.reply("Unrecognized stock! See '!stock list' for proper names");
            return updateHistory(msg, names, id, true);

        case "buy":
        case "sell":
            if(!args[1] || !args[2]) return msg.reply("You need to specify what and how much you want to buy/sell!"
                                                     +"\nUsage: '!stock buy pfizer 10'");
            return handleExchange(msg, args, client, false);

        default:
            if (args[0]) return msg.reply("Unrecognized command! See '!stock' for help");
            var helpEmbed = new Discord.MessageEmbed()
                .setColor('#c17f33')
                .setTitle('Stock Market Commands')
                .setDescription('Usable commands: list, get, buy, sell, portfolio')
                .addFields(
                { 
                    name: 'Example usage:', 
                    value: '!stock list\n'
                            +'!stock get pfizer\n'
                            +'!stock buy gland 10\n'
                            +'!stock sell dreddy 5\n'
                            +'!stock portfolio' 
                });
            return msg.channel.send({ embeds: [helpEmbed] });
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*STOCK HISTORY*/


async function getStock(msg, name, num)
{
    let rawData = fs.readFileSync(path.resolve(__dirname, 'jsons/pharma_history.json'));                // Get JSON of values
    var history = JSON.parse(rawData);                                                                  // Parse JSON
    
    var dataArr = [];
    for (var i = 1; i < history[num].length; i++) dataArr.push(history[num][i]);

    var labs = [];
    for (var x = 1; x <= cutoff; x++) labs.push(x);

    var data = 
    {                                                                                    			    // Graph data
        labels: labs,
        datasets:
        [{
            label: 'Last ' + cutoff + ' Values',
            data: dataArr,
            fill: false,
            borderColor: 'rgb(193, 127, 51)',                                                           // Line color
            borderWidth: 8,                                                                             // Line thickness
            backgroundColor: 'rgb(193, 127, 51)',                                                       // Dot color
            tension: 0                                                                                  // Line curve amount
        }]
    };
    
    const embed = new Discord.MessageEmbed()
        .setColor('#c17f33')
        .setTitle(name)
        .setDescription('Current value: $' + history[num][history[num].length - 1] + '\n' +
                        'Last updated: ' + history[num][0]);

    var configuration = 
    {                                                                           					    // Graph configuration
        type: 'line',
        data: data
    };

    var attachmentName = Date.now() + '.png';                                                           // Attachment name
    var canvas = new ChartJSNodeCanvas({width, height});                                                // Canvas
    var image = await canvas.renderToBuffer(configuration);                                             // Generate image
    var attach = new MessageAttachment(image, attachmentName);

    // embed.attachFiles([attach])                                                           
    embed.setImage('attachment://' + attachmentName);
    msg.channel.send({ embeds: [embed], files: [attach] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*STOCK EXCHANGE*/


/* Determines user intent and dispatches info to function */
function handleExchange(msg, args, client, list)
{
    const options =                                                                                     // Request options
    {
        method: 'GET',
        url: 'https://latest-stock-price.p.rapidapi.com/price',
        qs: {Indices: 'NIFTY PHARMA'},
        headers:
        {
            'X-RapidAPI-Host': 'latest-stock-price.p.rapidapi.com',
            'X-RapidAPI-Key': '3d085a3a0emshee8e456de2efc33p1dccacjsn7307704dbc9c',
            useQueryString: true
        }
    };
    try
    {
        request(options, function (error, response, body)                                               // Node request
        {
            var dat = JSON.parse(body);                                                                 // Parse body as JSON
            if (error)
            {
                console.log("/// Error with request in stock.js!");
                return false;
            }

            if (list) return listStocks(msg, dat);

            var symb = args[1].toLowerCase();
            var amnt = args[2];

            if (isNaN(amnt)) return msg.reply("You must specify a numberical amount of stocks!"
                                            + "\n Usage: '!stock buy pfizer 3'");

            var indx; var match = false;
            for (var i = 1; i < 21; i++)
            {
                if (dat[i].symbol.toLowerCase() === symb)
                {
                    match = true;
                    indx = i;
                    break;
                }
            }
            if (!match) return msg.reply("Sorry, I couldn't find the stocks you were looking for!");

            switch(args[0])
            {
                case "buy":
                    return buyStocks(msg, amnt, dat, indx, symb, client);
                case "sell":
                    return sellStocks(msg, amnt, dat, indx, symb, client);
            }
        });
    }
    catch
    {
        console.log("/// JSON error");
        msg.reply("Oops, small issue checking stock prices. Please try again!");
    }
}

/* For purchasing shares from the market */
async function buyStocks(msg, amt, dat, indx, symb, client)
{
    var checkQuery = { text: "SELECT money FROM current_balance WHERE name = '"+ msg.author.tag +"'" };
	client.query(checkQuery, (err, res) =>
	{
        if (err)                                                                                        // Error with query
		{
			console.log("/// Error checking balance for stock purchase!");
			msg.reply("An unexpected error occurred while trying to check your balance!");
			return;
		}
        else if (res.rows[0] == undefined)															    // User not found in db
        {
            msg.reply("You need to have an account to gamble!");
            msg.channel.send("Use '!balance' to open one.");
            return;
        }
        var balance = res.rows[0].money;
        var totCost = dat[indx].lastPrice * amt;
        if (balance < totCost) 
            return msg.reply("This transaction would exceed your current balance by "
            + (totCost - balance) + " points!");

        adjShares(client, msg, symb, amt, true, 0);
        money.adjustBalance(client, msg.author.tag, -(totCost), false);

        msg.reply("Shares purchased for " + totCost + ".");
    });
}

/* For selling held shares */
async function sellStocks(msg, amt, dat, indx, symb, client)
{
    var checkQuery = { text: "SELECT num FROM portfolio WHERE share = '" + symb 
                    + "' AND name ='" + msg.author.tag + "'" };
    client.query(checkQuery, (err, res) =>
    {
        if (err)                                                                                        // Error with query
		{
			console.log("/// Error checking stocks for sale!");
			msg.reply("An unexpected error occurred while trying to check your shares!");
			return;
		}
        var curr = (res.rows[0] == undefined) ? null : res.rows[0];

        if (!curr) return msg.reply("You do not own any shares of " + symb + "!");
        if (parseInt(amt) > parseInt(curr.num)) return msg.reply("You cannot sell more shares than you own!");

        adjShares(client, msg, symb, amt, false, parseInt(curr.num));
        money.adjustBalance(client, msg.author.tag, (dat[indx].lastPrice * amt), false);

        msg.reply("Your shares have sold for " + (dat[indx].lastPrice * amt) + " points.");
    });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*STOCK UPDATER*/


async function updateHistory(msg, names, id, sendmsg)
{
    let rawData = fs.readFileSync(path.resolve(__dirname, 'jsons/pharma_history.json'));                // Get JSON of values
    var history = JSON.parse(rawData);                                                                  // Parse JSON
    const options =                                                                                     // Request options
    {
        method: 'GET',
        url: 'https://latest-stock-price.p.rapidapi.com/price',
        qs: {Indices: 'NIFTY PHARMA'},
        headers:
        {
            'X-RapidAPI-Host': 'latest-stock-price.p.rapidapi.com',
            'X-RapidAPI-Key': '3d085a3a0emshee8e456de2efc33p1dccacjsn7307704dbc9c',
            useQueryString: true
        }
    };
    try
    {
        request(options, function (error, response, body)                                               // Node request
        {
            var dat = JSON.parse(body);                                                                 // Parse body as JSON

            if (error)
            {
                console.log("/// Error with request in stock.js!");
                return false;
            }
            try
            {
                for (var i = 1; i < 21; i++)
                {
                    var symb = dat[i].symbol.toLowerCase();
                    var lsUp = dat[i].lastUpdateTime;                                                   // Last updated value of stock
                    var indx = nameMapping[symb];
                    if (lsUp != history[indx][0])
                    {
                        history[indx][0] = lsUp;                                                        // Updates timestamp
                        var currVal = dat[i].lastPrice;                                                 // Current value of given stock
                        if (history[indx][cutoff] == undefined)                                         // Less than #<cutoff> stock values in array
                            history[indx].push(currVal);
                        else                                                                            // #<cutoff> values exist, need to shift down
                        {
                            for (var k = 1; k < cutoff; k++)
                                history[indx][k] = history[indx][k + 1];
                            history[indx][cutoff] = currVal;
                        }
                    }
                }
                var data = JSON.stringify(history, null, "\t");                                         // Stringify JSON
                fs.writeFile(path.resolve(__dirname, "jsons/pharma_history.json"), data, (err) =>
                {
                    if (err) console.log(err);
                    else if (sendmsg) getStock(msg, names[id], id);										// Gets stock after update
                });
            }
            catch (error)
            {
                console.log("/// Error with try block in stock.js request!");
                console.log(error);
                msg.channel.send("I'm having slight trouble updating the stocks...\nPlease try again or give it a moment if it still doesn't work.");
                return false;
            }
        });
    }
    catch
    {
        console.log("/// JSON error");
        msg.reply("Oops, small issue checking stock prices. Please try again!");
    }
    return true;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*OTHER FUNCTIONS*/


/* Adjusts share quantity held by user */
async function adjShares(client, msg, symb, amt, add, cn)
{
    if (add)
    {
        var chk = { text: "SELECT num FROM portfolio WHERE name = '" + msg.author.tag + "' AND share = '" + symb + "'"};
        var qry;
	    client.query(chk, (err, res) =>
        {
            var curr = (res.rows[0] == undefined) ? null : res.rows[0];

            if (curr)
                qry = { text: "UPDATE portfolio SET num = " + (parseInt(curr.num) + parseInt(amt))
                + " WHERE name = '" + msg.author.tag + "' AND share = '" + symb + "'"};
            else
                qry = { text: "INSERT INTO portfolio (share, name, num) VALUES ('"+ symb 
                +"', '"+ msg.author.tag +"', "+ amt +")" };
            
            client.query(qry, (err, res) => {});
        });
    }
    else
    {
        if (parseInt(amt) != cn) var qry = { text: "UPDATE portfolio SET num = " + (cn - parseInt(amt))
                            + " WHERE name = '" + msg.author.tag + "' AND share = '" + symb + "'"};
        else var qry = { text: "DELETE FROM portfolio WHERE name = '" + msg.author.tag + "' AND share = '" 
                            + symb + "'" };

        client.query(qry, (err, res) => {});
    }
}

/* Lists available stocks and prices */
function listStocks(msg, dat)
{
    var namesEmbed = new Discord.MessageEmbed();
    var nameList = "";
    var NCArr = [];

    for (var i = 1; i < 21; i++)
    {
        var price = dat[i].lastPrice;
        var symb = dat[i].symbol;
        NCArr.push(names[nameMapping[symb.toLowerCase()]] + ": $" + price);
    }
    for (var l = 0; l < 20; l++) nameList += "\n" + NCArr[l];
    
    namesEmbed.addFields
    ({
        name: 'Available Stocks',
        value: nameList.trim()
    });
    return msg.channel.send({ embeds: [namesEmbed.setColor('#c17f33')] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*PORTFOLIO FUNCTIONS*/


function viewPortfolio(msg, client)
{
    var embed = new Discord.MessageEmbed();
    var query = { text: "SELECT * FROM portfolio WHERE name = '" + msg.author.tag + "'"};
    client.query(query, (err, res) =>
    {
        if (err)
        {
            msg.reply("Error while fetching portfolio!");
            console.log(err);
            return;
        }
        var result = (res.rows[0] == undefined) ? null : true;
        if (!result) return msg.reply("You don't seem to own any shares!");
        
        embed.setColor('#d4d977')
            .setTitle(msg.author.tag + "'s Portfolio")
            .setThumbnail(msg.author.displayAvatarURL());

        var i = 0;
        do
        {
            embed.addFields
            ({
                name: names[nameMapping[res.rows[i].share]],
                value: "Shares held: " + res.rows[i].num
            });
            i++;
        } 
        while (res.rows[i] != undefined && res.rows[i] != null)
        msg.channel.send({embeds: [embed]})
    });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MODULE EXPORTS*/


module.exports =
{
    handleStocks
}