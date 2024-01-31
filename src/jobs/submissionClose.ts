import process from 'node:process';
import type { Channel, TextChannel } from 'discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { DateTime } from 'luxon';
import type { JobDefinition } from './index.js';

export default {
	async execute() {
		const client = new Client({ intents: [GatewayIntentBits.Guilds] });
		await client.login(process.env.DISCORD_TOKEN);
		client.on('ready', async (readyClient: Client<true>) => {
			if (!process.env.CHANNEL_ID) {
				console.error(`[ERROR]: No environment variable named CHANNEL_ID was found.`);
				return;
			}

			const channel: Channel | null = await readyClient.channels.fetch(process.env.CHANNEL_ID);
			if (channel === null) {
				console.error(`[ERROR] Couldn't find a channel with matching CHANNEL_ID.`);
				return;
			}

			if (!channel!.isTextBased()) {
				console.error("[ERROR]: Got a channel, but it wasn't text-based.");
			}

			// const rmfpSubmissionsOpen = DateTime.now()
			// 	.startOf('day')
			// 	.minus({ week: 1 })
			// 	.set({ hour: 10, minute: 0, second: 0 });
			// const rmfpSubmissionsClose = DateTime.now();
			// channel.messages.fetch({ m });
			// const channel = await readyClient.channels.fetch(process.env.CHANNEL_ID);
		});
	},

	schedule: '* * * * * *',
} satisfies JobDefinition;
