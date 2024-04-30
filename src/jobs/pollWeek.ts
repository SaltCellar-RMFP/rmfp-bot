import process from 'node:process';
import { Temporal } from '@js-temporal/polyfill';
import type { Week } from '@prisma/client';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Job } from './index.js';

const closeRMFPWeek = async (week: Week, client: Client) => {
	const guild = await client.guilds.fetch(process.env.GUILD_ID!);
	const rmfpOwnerRole = await guild.roles.fetch(process.env.ROLE_ID!);
	if (rmfpOwnerRole === null) {
		console.error(`[Close RMFP Week] No RMFP owner role was detected!`);
		return;
	}

	const rmfpOwners = rmfpOwnerRole.members.values();

	const winners = await prisma.week.winners(week.number);
	const content = [
		`The winner(s) of RMFP S${week.seasonNumber}W${week.number} are:`,
		...winners.map((winner, idx) => `${idx + 1}. <@${winner.userId}>'s [message](${winner.messageUrl})`),
	].join('\n');

	for (const owner of rmfpOwners) {
		await owner.send(content);
	}

	await prisma.week.update({
		where: {
			id: week.id,
		},
		data: {
			ended: true,
		},
	});
};

export default {
	cronTime: '0 * * * * *',
	start: true,
	onTick: async () => {
		console.log('[Poll Week] Checking for week expiration...');
		const week = await prisma.week.findFirst({
			where: {
				ended: false,
			},
		});

		if (week === null) {
			console.warn('[Poll Week] Week not found.');
			return;
		}

		console.log(`[Poll Week] Week found. Expiration: ${week.scheduledEnd}`);
		if (week.scheduledEnd.getTime() > Date.now()) {
			return;
		}

		console.log(`[Poll Week] Week has expired! Ending week.`);

		// The current week has ended -- Time to let the owners know!
		const client = new Client({
			intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds],
			partials: [Partials.Message, Partials.Channel],
		});
		await client.login(process.env.DISCORD_TOKEN!);
		await closeRMFPWeek(week, client);
	},
	timeZone: 'UTC',
} satisfies Job;
