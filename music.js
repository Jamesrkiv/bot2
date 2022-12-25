// DISCORD BOT 2
// MUSIC FUNCTIONS
// Created: 		3/7/22
// Last modified:	12/24/22


const Discord = require('discord.js');
const config = require('./jsons/config.json'); 														// Generic config declaration in event other things are added
const ytdl = require("ytdl-core");
const { getInfo } = require('ytdl-getinfo');
const {
	AudioPlayerStatus,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
    getVoiceConnection
} = require("@discordjs/voice");
const { SystemChannelFlags } = require('discord.js');

var queue = new Map();                                                                              // Queue map
var playerQ = new Map();                                                                            // Queue of players
var connection = null;                                                                              // Connection variable


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MAIN WORKFLOW*/


module.exports =
{
    /**
     * Function exported by module to handle incoming commands regarded the bot's
     * music functionality.
     * @param {*} msg Discord message
     * @param {*} args Text as received from index.js
     */
    handleMusic: (msg, args) =>                                                                     // Handler for !m commands
    {
        const serverQueue = queue.get(msg.guild.id);                                                // Gets server queue, if possible

        var canPlay = msg.member.roles.cache.some(role => role.name === 'DJ');                      // Boolean indicating if player has DJ role
        if (!canPlay) return msg.reply("You don't have the proper permissions to use this");        // Check for DJ role

        switch(args[0])
        {
            case "play":
                if (!args[1])
                    return msg.reply("You need to include a YouTube link to use this command!");
                play(msg, serverQueue, args);                                                       // Call play function
                return;

            case "skip":
                msg.channel.send("Skipping current song...");
                if (!serverQueue) return msg.reply("You need to be playing something to skip!");
                serverQueue.songs.shift();                                                          // Shift queue on end of song
                // console.log(serverQueue.songs);
                playSong(msg.guild, serverQueue.songs[0], connection, msg, serverQueue);            // Attempts to play next song
                break;

            case "stop":
                queue.delete(msg.guild.id);                                                         // Delete queue
                try { connection.destroy(); }                                                       // Terminate connection
                catch (err) { return msg.channel.send("Music queue already clear!"); }
                var clrdEmbed = new Discord.MessageEmbed()                                          // Create message embed for aesthetics
                    .setTitle(`Music queue cleared!`)
                    .setColor('#FF001F');
                return msg.channel.send({ embeds: [clrdEmbed] });

            default:
                if (args[0]) return msg.reply("Unrecognized command! See '!m' for help");
                var helpEmbed = new Discord.MessageEmbed()
                    .setColor('#40B332')
                    .setTitle('Music Commands')
                    .setDescription('Usable commands: play, skip, stop')
                    .addFields(
                        { name: 'Example usage:', value: '!m play <YouTube URL>\n!m stop' }
                    );
                return msg.channel.send({ embeds: [helpEmbed] });
        }
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*MUSIC PLAYING*/


/**
 * Gets info for song/queue to be exported to playSong function. Also establishes
 * the bot's connection to a voice channel.
 * @param {*} msg Discord message
 * @param {*} serverQueue Music queue for server
 * @param {*} args Text as received from index.js
 */
async function play(msg, serverQueue, args)
{
    const voiceChannel = msg.member.voice.channel;                                                  // User voice channel                                          
    if(!voiceChannel) return msg.reply("You must be in a voice channel!");                          // Checks user is in voice channel

    const permission = voiceChannel.permissionsFor(msg.client.user);                                // Bot permissions
    if(!permission.has('CONNECT') || !permission.has("SPEAK"))                                      // Checks bot permission
        return msg.channel.send("I need permission to join and speak in your voice channel!");
        
    var guild = msg.guild;                                                                          // Discord server variable   

    args[1] = args[1].replace('<', '');
    args[1] = args[1].replace('>', '');

    checkurl = validateYouTubeUrl(args[1]);
    if(!checkurl) return msg.reply("Not a valid YouTube URL");

    var song = null;
    try
    {
        var songInfo = await getInfo(args[1]);                                                      // Song info from ytdl
        // console.log(songInfo);
        song =                                                                                      // Song object
        {
            title: songInfo.items[0].title,
            url: args[1]
        };
    }
    catch(err)
    {
        // console.log(err);
        return msg.reply("Sorry, I seem to be having trouble checking that link.");
    }
    if (song == null) return msg.reply("Unable to find provided YouTube video!");
    
    connection = new joinVoiceChannel                                                               // Connection variable
    ({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    if(!serverQueue)                                                                                // Checks for a server queue
    {
        const queueConstruct =
        {
            textChannel: msg.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };
        queueConstruct.songs.push(song);                                                            // Push song to queue
        queue.set(msg.guild.id, queueConstruct);                                                    // Sets new queue
        try
        {
            playSong(msg.guild, song, connection, msg, queue.get(msg.guild.id));                    // Tries to play song from queue
            return;
        }
        catch (err)
        {
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send("There was an error playing! " + err);
        }
    }
    else
    {
        serverQueue.songs.push(song);                                                               // Adds song to queue

        var addedEmb = new Discord.MessageEmbed()                                                   // Create message embed for aesthetics
            .setTitle(`${song.title} has been added to the queue!`)
            .setColor('#FF001F');
        // console.log(serverQueue.songs);
        return msg.channel.send({ embeds: [addedEmb] });
    }
}

/**
 * Interacts with song queue to play music, makes audio resources from YouTube
 * URLs stored in the song queue.
 * @param {*} guild Discord server music is being played in
 * @param {*} song Object to hold info regarding a queued song
 * @param {*} connection Bot's connection to a discord voice channel
 * @param {*} msg Discord message
 * @param {*} serverQueue The given server's current queue of music
 */
function playSong(guild, song, connection, msg, serverQueue)
{
    if(!song)                                                                                       // Checks if song exists
    {
        var conclEmbed = new Discord.MessageEmbed()                                                 // Create message embed for aesthetics
            .setTitle(`Song queue concluded!`)
            .setColor('#FF001F');
        msg.channel.send({ embeds: [conclEmbed] });
        queue.delete(guild.id);                                                                     // Deletes queue
        try
        {
            const con = getVoiceConnection(guild.id);                                               // Obtains voice connection within server
            con.destroy();                                                                          // Destroys voice connection
        }
        catch (err)
        {   
            console.log("/// Destr err");
            return; 
        }                                                                       
        return;
    }

    var player = playerQ.get(guild.id);                                                             // Attempts to get server audio player
    if (!player)                                                                                    // Checks if audio player exists
    {
        const ap = createAudioPlayer();                                                             // Creates new audio player
        playerQ.set(guild.id, ap);                                                                  // Inserts audio player into queue under serverID

        player = playerQ.get(guild.id);                                                             // Gets newly created audio player
        player.on(AudioPlayerStatus.Idle, () =>                                                     // Listener for audio player idle
        {
            // console.log("Song ended!");
            serverQueue.songs.shift();                                                              // Shift queue on end of song
            // console.log(serverQueue.songs);
            playSong(guild, serverQueue.songs[0], connection, msg, serverQueue);                    // Attempts to play next song
        });
    }

    const stream = ytdl(song.url, { filter: 'audioonly' });                                         // Audio stream
    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });              // Audio resource
    
    player.play(resource);                                                                          // Player resource via player
    connection.subscribe(player);                                                                   // Subscribe server connection to audio player
    var plyEmbed = new Discord.MessageEmbed()                                                       // Create message embed for aesthetics
            .setTitle(`Now playing: ${song.title}`)
            .setColor('#FF001F');
    msg.channel.send({ embeds: [plyEmbed] });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*SUPPORT FUNCTIONS*/


/**
 * Simple regex function for validating a query as a usable YouTube URL.
 * @param {*} url Supposed URL to be checked by regex
 * @return Boolean indicating whether the URL is a YouTube URL
 */
function validateYouTubeUrl(url)
{
    if (url != undefined || url != '')
    {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;        // Regular expression for youtube links
        var match = url.match(regExp);                                                              // Checks string against regex
        if (match) return true;
        else return false;
    }
    else return false;
}