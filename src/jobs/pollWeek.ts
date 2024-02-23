import process from 'node:process';
import { Temporal } from '@js-temporal/polyfill';
import type { Week } from '@prisma/client';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Job } from './index.js';

const closeRMFPWeek = async (week: Week, client: Client) => {
	const winners = await prisma.week.winners(week.number);
	// Populate channel information
	const channel = (await client.channels.fetch(process.env.CHANNEL_ID!))!;
	if (!channel.isTextBased()) {
		console.error(`[Poll Week Job] - The provided CHANNEL_ID does not point to a text-based channel.`);
		return;
	}

	console.log('closing week');
};

const announceImpendingDeadline = async (week: Week, client: Client) => {};

export default {
	cronTime: '0 * * * * *',
	start: true,
	onTick: async () => {
		const week = await prisma.week.findFirst({
			where: {
				ended: false,
			},
		});

		if (week === null) {
			return;
		}

		if (week.scheduledEnd.getTime() < Date.now()) {
			// The current week has ended -- Time to let everyone know!
			const client = new Client({
				intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
				partials: [Partials.Message, Partials.Channel],
			});
			await client.login(process.env.DISCORD_TOKEN!);
			await closeRMFPWeek(week, client);
			return;
		}

		const now = Temporal.Now.zonedDateTimeISO(Temporal.Now.timeZoneId());
		const weekEndTemporal = Temporal.Instant.fromEpochMilliseconds(week.scheduledEnd.getTime()).toZonedDateTimeISO(
			Temporal.Now.timeZoneId(),
		);
		const daysRemaining = now.until(weekEndTemporal, { largestUnit: 'day' }).days;
		if (daysRemaining <= 2) {
			const client = new Client({
				intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
			});
			await client.login(process.env.DISCORD_TOKEN!);
			await announceImpendingDeadline(week, client);
		}
	},
} satisfies Job;
