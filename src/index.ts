import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands, loadEvents } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';

// Initialize the client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load the events and commands
const eventsUrl = new URL('events/', import.meta.url);
const commandsUrl = new URL('commands/', import.meta.url);
const events = await loadEvents(eventsUrl);
const commands = await loadCommands(commandsUrl);

// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN).then(() => console.log('Logged in successfully!'));
