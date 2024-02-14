import process from 'node:process';
import type { Message } from 'discord.js';
import { Events } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageDelete,
	once: false,
	async execute(message: Message) {
		if (
			!message.mentions.has(process.env.APPLICATION_ID!) ||
			message.guildId !== process.env.GUILD_ID! ||
			message.channelId !== process.env.CHANNEL_ID!
		) {
			return;
		}

		// Fetch the entry's data before deletion
		const entry = await prisma.entry.findUnique({
			where: {
				messageId: message.id,
			},
		});

		// Delete the entry from the DB
		await prisma.entry.delete({
			where: {
				messageId: message.id,
			},
		});

		if (entry === null) {
			return;
		}

		// Update the user's earliest entry to have the first-time bonus
		if (entry.firstTimeBonus > 0) {
			await updateFirstEntryBonus(entry.userId);
		}

		// If their entry is a winning entry, we need to move the winner bonus to the runner-up(s) for that week.
		if (entry.winnerBonus > 0) {
			await updateWinnerBonus(entry.weekId);
		}
	},
} satisfies Event<Events.MessageDelete>;

async function updateFirstEntryBonus(userId: string) {
	const firstEntry = await prisma.entry.findFirst({
		where: {
			userId,
		},
		orderBy: {
			weekId: 'asc',
		},
	});
	if (firstEntry === null) {
		// If the user is deleting their first-ever entry, there's nothing to do. Early exit.
		return;
	}

	await prisma.entry.update({
		where: {
			messageId: firstEntry.messageId,
		},
		data: {
			firstTimeBonus: 3,
		},
	});
}

async function updateWinnerBonus(weekId: number) {
	const nextWinners = await prisma.week.winners(weekId);
	if (nextWinners.length === 0) {
		// If there are no other winners (how?), early exit.
		return;
	}

	const winnerIds = nextWinners.map((winner) => winner.messageId);
	await prisma.entry.updateMany({
		where: {
			messageId: {
				in: winnerIds,
			},
		},
		data: {
			winnerBonus: 2,
		},
	});
}
