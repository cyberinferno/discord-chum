/**
 * Database helper
 */

'use strict';

const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('BotDatabase.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to the bot database.');
});

db.serialize(function () {
  db.run('CREATE TABLE IF NOT EXISTS guild(id INTEGER PRIMARY KEY AUTOINCREMENT, discord_id INTEGER NOT NULL, discord_name TEXT NOT NULL, server_url TEXT, forum_url TEXT, download_url TEXT, help_channel_name TEXT DEFAULT \'help\', welcome_channel_name TEXT DEFAULT \'welcome\', show_welcome_msg INTEGER DEFAULT 0 NOT NULL, welcome_msg TEXT DEFAULT \'Welcome fellow gamer!\', is_deleted INTEGER DEFAULT 0 NOT NULL);');
  db.run('CREATE TABLE IF NOT EXISTS guild_command(id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER NOT NULL, command TEXT NOT NULL, output TEXT NOT NULL, is_deleted INTEGER DEFAULT 0 NOT NULL, FOREIGN KEY(guild_id) REFERENCES guild(id))');
});

module.exports = {
  getGuild: function (guildName, guildId, callback) {
    db.get('SELECT * FROM guild WHERE is_deleted = 0 AND discord_id = ?', [guildId], function (err, row) {
      if (!err && row !== undefined) {
        if (typeof callback === 'function') {
          callback(row);
        }
      } else {
        console.log('Could not get guild ' + guildName + ' hence creating');
        db.run('INSERT INTO guild(discord_id, discord_name) VALUES(?, ?)', [guildId, guildName], function (err) {
          if (err) {
            console.log('There was some error inserting guild ' + guildName);
            console.log(err.message);
          } else {
            db.get('SELECT * FROM guild WHERE is_deleted = 0 AND discord_id = ?', [guildId], function (err, row) {
              if (!err && row !== undefined) {
                db.run('INSERT INTO guild_command(guild_id, command, output) VALUES(?, ?, ?)', [row.id, 'info', 'Welcome fellow gamer!']);
                if (typeof callback === 'function') {
                  callback(row);
                }
              } else {
                console.log('There was some error creating guild');
                if (typeof callback === 'function') {
                  callback(null);
                }
              }
            });
          }
        });
      }
    });
  },
  getGuildCommand: function (id, command, callback) {
    db.get('SELECT * FROM guild_command WHERE guild_id = ? AND command = ? AND is_deleted = 0', [id, command], function (err, row) {
      if (err || row === undefined) {
        if (typeof callback === 'function') {
          callback(null);
        }
      } else {
        if (typeof callback === 'function') {
          callback(row);
        }
      }
    });
  },
  getGuildCommands: function (id, callback) {
    db.all('SELECT * FROM guild_command WHERE guild_id = ? AND is_deleted = 0', [id], function (err, rows) {
      if (err || rows === undefined) {
        if (typeof callback === 'function') {
          callback([]);
        }
      } else {
        if (typeof callback === 'function') {
          callback(rows);
        }
      }
    });
  },
  setGuildVariable: function (guildId, variableName, value, callback) {
    db.run('UPDATE guild SET ' + variableName + ' = ? WHERE id = ?', [value, guildId], function (err) {
      if (err) {
        console.log('There was error updating ' + variableName + ' for guild ' + guildId);
      }
      if (typeof callback === 'function') {
        callback(err);
      }
    });
  }
};
