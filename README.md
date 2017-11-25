# DiscordChum

A simple Discord bot written to help admins of online game server discord guilds to automate trivial tasks

## Installation

Easiest way to get started is to invite the bot to your guild using the [Invite Link](https://discordapp.com/api/oauth2/authorize?client_id=382623848778039306&scope=bot&permissions=76800).

Once the bot has joined your guild, create a private channel named `discord-chum-control` and give 
`DiscordChum` role access permission. This is the channel where you can configure the bot 
and execute control commands.

If you want to enable help commands to your users, create the channel defined in `help_channel_name` 
and use `create` control command to define user commands.

If you want to show custom welcome message to newly joining users, create the channel defined 
in `welcome_channel_name`, set the value of `show_welcome_msg` to `1` 
and update the value of `welcome_msg` if needed.

If you want to run the server yourself then do the following in your server
* Install latest version of `NodeJS`
* Install required project dependencies
* Create a new Discord app and add bot user to it by visiting [My Discord Applications](https://discordapp.com/developers/applications/me)
* Create a copy of the file `config_example.json` and name it `config.json`. Update your new app bot user's token in `config.json`
* Run `bot.js` using some node background process runners like `pm2` or `forever` so it stays running.

## Available control commands

| Name                                         | Description                                                                                               |
|:--------------------------------------------:|:---------------------------------------------------------------------------------------------------------:|
| list                                         | Shows the list of all available control commands                                                                            |
| set `variable_name`                          | Updates the value of predefined variables. Available variables are `help_channel_name`, `show_welcome_msg`, `welcome_channel_name`, `welcome_msg`, `server_url`, `forum_url` and `download_url` |
| show `variable_name`                         | Shows the value of a predefined variable if it is set
| create command `command_identifier` `Output` | Create a command and it's output which can be executed by a player in help channel (Work in progress)                       |
| view command `command_identifier`            | View a command's output |
| update command `command_identifier` `Output` | Update a command and it's output which can be executed by a player in help channel (Work in progress)                       |
| delete command `command_identifier`          | Delete a command |

#### Predefined variables usable with `set` command

| Variable Name          | Default Value          | Description                                                                                               |
|:----------------------:|:----------------------:|:---------------------------------------------------------------------------------------------------------:|
|`help_channel_name`     |`help`                  | Channel where normal users can execute commands defined by the admin |
|`welcom_channel_name`   |`welcome`               | Channel where welcome message will be displayed if `show_welcome_msg` is set to 1 |
|`welcome_msg`           |`Welcome fellow gamer!` | Welcome message that is displayed  if `show_welcome_msg` is set to 1|
|`show_welcome_msg`      |`0`                     | Whether to show welcome message to a newly joined user. Accepts `0` which means disabled and `1` which means enabled.  |
|`server_url`            |`null`                  | Main URL of your game server. If value is not `null` it will be automatically appended to `!info` command of a user |
|`forum_url`             |`null`                  | Forum URL of your game server. If value is not `null` it will be automatically appended to `!info` command of a user |
|`download_url`          |`null`                  | Client download URL of your game server. If value is not `null` it will be automatically appended to `!info` command of a user |

#### Report all issues at [DiscordChum Github Issues](https://github.com/cyberinferno/discord-chum/issues)
