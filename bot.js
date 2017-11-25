/**
 * Tantra Online Discord Bot
 *
 * Invite link: https://discordapp.com/api/oauth2/authorize?client_id=382623848778039306&scope=bot&permissions=76800
 */

'use strict';

const Discord = require('discord.js');
const bot = new Discord.Client();

const config = require('./config.json');
const db = require('./db.js');

const availableVariables = ['server_url', 'forum_url', 'download_url', 'welcome_channel_name', 'welcome_msg', 'show_welcome_msg', 'help_channel_name'];

bot.on('ready', () => {
  console.log(`Bot has started, with ${bot.users.size} users, in ${bot.channels.size} channels of ${bot.guilds.size} guilds.`);
  bot.user.setGame(`version ${config.version}`);
  for (let guild in bot.guilds) {
    db.getGuild(guild.name, guild.id);
  }
});

bot.on('message', async message => {
  // This event will run on every single message received, from any channel or DM.

  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if (message.author.bot) {
    return;
  }

  // Also good practice to ignore any message that does not start with our prefix,
  // which is set in the configuration file.
  if (message.content.indexOf(config.prefix) !== 0) {
    return;
  }

  // Here we separate our "command" name, and our "arguments" for the command.
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Get guild the message belongs to
  db.getGuild(message.guild.name, message.guild.id, function (guild) {
    if (guild === null) {
      console.log('Could not get guild from database for some reason');
    }
    // Check if control command or message came from control channel
    if (config.control_commands.includes(command) && config.control_channels.includes(message.channel.name)) {
      switch (command) {
        case 'list':
          message.reply('Available commands are `' + config.control_commands.join('`, `') + '`.\nFor more information visit https://github.com/cyberinferno/discord-chum/blob/master/README.md');
          break;
        case 'set':
          processSetCommand(args, message, guild);
          break;
        case 'show':
          processShowCommand(args, message, guild);
          break;
        case 'create':
          processCreateCommand(args, message, guild);
          break;
        case 'update':
          processUpdateCommand(args, message, guild);
          break;
        case 'delete':
          processDeleteCommand(args, message, guild);
          break;
        case 'view':
          processViewCommand(args, message, guild);
          break;
        default:
          message.reply('Invalid command or the command is work in progress. To get a list of all available commands use `!list`');
          break;
      }
    } else {
      // Might be custom command
      if (guild !== null && guild.help_channel_name && message.channel.name === guild.help_channel_name) {
        if (command === 'help') {
          db.getGuildCommands(guild.id, function (data) {
            if (data.length === 0) {
              message.reply('There are no available commands currently. Please come back later when admin adds new commands');
            } else {
              let commandList = [];
              for (let row in data) {
                if (data[row].command) {
                  commandList.push(data[row].command);
                }
              }
              if (commandList.length === 0) {
                message.reply('There are no available commands currently. Please come back later when admin adds new commands');
              } else {
                message.reply('Available commands: `!' + commandList.join('`, `!') + '`');
              }
            }
          });
        } else {
          db.getGuildCommand(guild.id, command, function (data) {
            if (data === null) {
              message.reply('Invalid command. To get a list of all available commands use `!help`');
            } else {
              let output = data.output;
              if (data.command === 'info') {
                if (guild.server_url && guild.server_url !== 'null') {
                  output += '\nServer link: ' + guild.server_url;
                }
                if (guild.forum_url && guild.forum_url !== 'null') {
                  output += '\nForum link: ' + guild.forum_url;
                }
                if (guild.download_url && guild.download_url !== 'null') {
                  output += '\nDownload link: ' + guild.download_url;
                }
              }
              message.reply(output);
            }
          });
        }
      }
    }
  });
});

bot.on('guildCreate', guild => {
  console.log('I was added to guild ' + guild.name + ' with ID ' + guild.id);
  db.getGuild(guild.name, guild.id);
});

bot.on('guildDelete', guild => {
  console.log('I was removed from guild ' + guild.name + ' with ID ' + guild.id);
});

bot.on('guildMemberAdd', member => {
  db.getGuild(member.guild.name, member.guild.id, function (guild) {
    if (guild === null) {
      console.log('Could not get guild from database for some reason');
    } else if (guild.show_welcome_msg === 1) {
      // Send the message to a designated channel on a server:
      const channel = member.guild.channels.find('name', guild.welcome_channel_name);
      // Do nothing if the channel wasn't found on this server or the user is a bot
      if (!channel || member.user.bot) return;
      // Send the message, mentioning the member
      channel.send(`${guild.welcome_msg}, ${member}`);
    }
  });
});

// Log our bot in
bot.login(config.token).catch(function (err) {
  console.log('Could not start DiscordChum');
  console.log(err.message);
  process.exit();
});

function processSetCommand(args, message, guild) {
  if (!availableVariables.includes(args[0])) {
    message.reply('Invalid variable name specified. Please refer documentation to know all the available in built variables that can be set!');
  } else {
    if (guild === null) {
      message.reply('Could not update the variable ' + args[0] + '. Please try again later!');
    } else {
      if (args[0] === 'show_welcome_msg') {
        let newValue = parseInt(args[1]);
        if (isNaN(newValue) || (newValue !== 0 && newValue !== 1)) {
          message.reply('Value of this variable can either be `0` or `1`');
        } else {
          updateGuildVariable(guild.id, args[0], args[1], message);
        }
      }
      if (args[0] === 'welcome_msg') {
        let variableName = args.shift();
        updateGuildVariable(guild.id, variableName, args.join(' '), message);
      }
      if (args[0].endsWith('_url')) {
        if (!isUrl(args[1])) {
          message.reply('Value of this variable has to be a valid URL');
        } else {
          updateGuildVariable(guild.id, args[0], args[1], message);
        }
      }
      if (args[0].endsWith('_channel_name')) {
        updateGuildVariable(guild.id, args[0], args[1], message);
      }
    }
  }
}

function updateGuildVariable(guildId, variableName, variableValue, message) {
  db.setGuildVariable(guildId, variableName, variableValue, function (err) {
    if (err) {
      message.reply('Could not update the variable ' + variableName + '. Please try again later!');
    } else {
      message.reply('Variable was successfully updated. To view it\'s value use the command `!show ' + variableName + '`');
    }
  });
}

function processShowCommand(args, message, guild) {
  if (!availableVariables.includes(args[0])) {
    message.reply('Invalid variable name specified. Please refer documentation to know all the available in built variables!');
  } else {
    if (guild === null || !guild[args[0]]) {
      message.reply('Could not display the value of the variable ' + args[0] + '. Please set the variable before using show command!');
    } else {
      message.reply(args[0] + '\'s value is `' + guild[args[0]] + '`');
    }
  }
}

function processCreateCommand(args, message, guild) {
  let command = args.shift();
  switch (command) {
    case 'command':
      processUserExecutableCreateCommand(args, message, guild);
      break;
    default:
      message.reply('Invalid option given to create command. Please refer DiscordChum documentation to know available options.');
      break;
  }
}

function processUpdateCommand(args, message, guild) {
  let command = args.shift();
  switch (command) {
    case 'command':
      processUserExecutableUpdateCommand(args, message, guild);
      break;
    default:
      message.reply('Invalid option given to update command. Please refer DiscordChum documentation to know available options.');
      break;
  }
}

function processViewCommand(args, message, guild) {
  let command = args.shift();
  switch (command) {
    case 'command':
      processUserExecutableViewCommand(args, message, guild);
      break;
    default:
      message.reply('Invalid option given to view command. Please refer DiscordChum documentation to know available options.');
      break;
  }
}

function processDeleteCommand(args, message, guild) {
  let command = args.shift();
  switch (command) {
    case 'command':
      processUserExecutableDeleteCommand(args, message, guild);
      break;
    default:
      message.reply('Invalid option given to delete command. Please refer DiscordChum documentation to know available options.');
      break;
  }
}

function processUserExecutableCreateCommand(args, message, guild) {
  if (args.length < 2) {
    message.reply('Invalid create command format. Please refer documentation for more info');
  } else {
    let command = args.shift();
    if (!isAlphanumericHyphenUnderscore(command)) {
      message.reply('User executable command can only contain alphanumeric as well as hyphen and underscore characters only');
    } else {
      db.getGuildCommand(guild.id, command, function (data) {
        if (data !== null) {
          message.reply(command + ' command already exists. Please use update command to update it');
        } else {
          db.createGuildCommand(guild.id, command, args.join(' '), function (err) {
            if (err === undefined || err === '' || err === ' ' || err === null) {
              message.reply(command + ' command was successfully created');
            } else {
              message.reply(command + ' command could not be created. Please try again');
            }
          });
        }
      });
    }
  }
}

function processUserExecutableUpdateCommand(args, message, guild) {
  if (args.length < 2) {
    message.reply('Invalid create command format. Please refer documentation for more info');
  } else {
    let command = args.shift();
    if (!isAlphanumericHyphenUnderscore(command)) {
      message.reply('User executable command can only contain alphanumeric as well as hyphen and underscore characters only');
    } else {
      db.getGuildCommand(guild.id, command, function (data) {
        if (data === null) {
          message.reply(command + ' command does not exist');
        } else {
          db.updateGuildCommand(data.id, args.join(' '), function (err) {
            if (err === undefined || err === '' || err === ' ' || err === null) {
              message.reply(command + ' command was successfully updated');
            } else {
              message.reply(command + ' command could not be updated. Please try again');
            }
          });
        }
      });
    }
  }
}

function processUserExecutableViewCommand(args, message, guild) {
  let command = args.shift();
  if (!isAlphanumericHyphenUnderscore(command)) {
    message.reply('User executable command can only contain alphanumeric as well as hyphen and underscore characters only');
  } else {
    db.getGuildCommand(guild.id, command, function (data) {
      if (data === null) {
        message.reply('Invalid command. Please create the command before viewing it');
      } else {
        let output = data.output;
        if (data.command === 'info') {
          if (guild.server_url && guild.server_url !== 'null') {
            output += '\nServer link: ' + guild.server_url;
          }
          if (guild.forum_url && guild.forum_url !== 'null') {
            output += '\nForum link: ' + guild.forum_url;
          }
          if (guild.download_url && guild.download_url !== 'null') {
            output += '\nDownload link: ' + guild.download_url;
          }
        }
        message.reply(output);
      }
    });
  }
}

function processUserExecutableDeleteCommand(args, message, guild) {
  let command = args.shift();
  if (!isAlphanumericHyphenUnderscore(command)) {
    message.reply('User executable command can only contain alphanumeric as well as hyphen and underscore characters only');
  } else if (command === 'info') {
    message.reply('`info` is a default user executable command. Hence it cannot be deleted. It can only be updated');
  } else {
    db.getGuildCommand(guild.id, command, function (data) {
      if (data === null) {
        message.reply(command + ' command does not exist');
      } else {
        db.deleteGuildCommand(data.id, function (err) {
          if (err === undefined || err === '' || err === ' ' || err === null) {
            message.reply(command + ' command was successfully deleted');
          } else {
            message.reply(command + ' command could not be deleted. Please try again');
          }
        });
      }
    });
  }
}

function isUrl(str) {
  return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/.test(str);
}

function isAlphanumericHyphenUnderscore(str) {
  return /^[a-zA-Z0-9-_]+$/.test(str);
}
