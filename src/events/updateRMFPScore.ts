import { Temporal } from '@js-temporal/polyfill';
import type { Week } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { getLatestWeek } from '../common/getLatestWeek.js';

export const updateRMFPScore = async (reaction: MessageReaction | PartialMessageReaction, user: PartialUser | User) => {
	if (reaction.emoji.name !== '❤️') {
		return;
	}

	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

	if (user.partial) {
		try {
			await user.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the user:', error);
		}
	}

	const prisma = new PrismaClient();

	if (reaction.message.author === null) {
		console.error(`Can't update RMFP score for entry ${reaction.message.url} because author is null.`);
		return;
	}

	const latestWeek = await getLatestWeek(prisma);

	if (latestWeek === null) {
		return;
	}

	await prisma.entry.update({
		where: {
			entryId: {
				userId: reaction.message.author.id,
				weekNumber: latestWeek.number,
			},
		},
		data: {
			reacts: reaction.count!,
		},
	});
};
