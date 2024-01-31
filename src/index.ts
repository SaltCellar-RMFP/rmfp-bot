import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import { createJobs } from './util/createJobs.js';
import { loadCommands, loadEvents, loadJobs } from './util/loaders.js';
import { registerEvents } from './util/registerEvents.js';

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
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

const cronJobs = createJobs(jobs);

// Login to the client
void client.login(process.env.DISCORD_TOKEN).then(() => console.log('Logged in successfully!'));
