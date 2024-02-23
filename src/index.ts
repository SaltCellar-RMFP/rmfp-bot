import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands, loadEvents, loadJobs } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessageReactions,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Load the events and commands
const eventsUrl = new URL('events/', import.meta.url);
const commandsUrl = new URL('commands/', import.meta.url);
const jobsUrl = new URL('jobs/', import.meta.url);
const events = await loadEvents(eventsUrl);
const commands = await loadCommands(commandsUrl);
const jobs = await loadJobs(jobsUrl);
// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN).then(() => console.log('Logged in successfully!'));
