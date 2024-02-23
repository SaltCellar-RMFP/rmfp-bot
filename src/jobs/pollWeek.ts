import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Job } from './index.js';

export default {
	cronTime: '0 * * * * *',
	start: true,
	onTick: async () => {
		const currentWeek = await prisma.week.current();
		if (currentWeek === null) {
			return;
		}

		if (currentWeek.scheduledEnd.getTime() < Date.now()) {
			const winners = await prisma.week.winners(currentWeek.number);
			const client = new Client({
				intents: [
					GatewayIntentBits.GuildMessages,
					GatewayIntentBits.MessageContent,
					GatewayIntentBits.Guilds,
					GatewayIntentBits.GuildMessageReactions,
					GatewayIntentBits.GuildScheduledEvents,
				],
				partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildScheduledEvent],
			});
            
            await client.gui
		}
	},
} satisfies Job;
