// DISCORD BOT 2
// CHATBOT FUNCTIONS
// Created: 		12/16/22
// Last modified:	12/16/22


/* Node modules */
const Discord = require('discord.js');                                                                  // Discord JS
const request = require('request');                                                                     // Node request

/* External JSONs */
const config = require('./jsons/config.json'); 															// Generic config declaration in event other things are added


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


function chat(msg, message)
{
    const options =
    {
        method: 'GET',
        url: 'https://chatbot-api.vercel.app/api/',
        qs:
        {
            message: ('/' + message),
            name: 'Curiosity',
            gender: 'rover'
        },
        headers:
        {
            'X-RapidAPI-Key': '82bbe43a94msh35991d8b0ea1522p19fc79jsndb9ec63d7f9d',
            'X-RapidAPI-Host': 'chatbot-chatari.p.rapidapi.com',
            useQueryString: true
        }
    };
    
    request(options, function (error, response, body)
    {
        if (error) return msg.reply("Seems I'm not feeling up to responding right now. " +
                                    "Feel free to try again, or not. Whatever. (Error)");

        // console.log(body);
        msg.channel.send(JSON.parse(body).message);
    });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports =
{
    chat
};