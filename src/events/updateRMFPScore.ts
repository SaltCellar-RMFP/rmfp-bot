import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { prisma } from '../common/prisma.js';

export const updateRMFPScore = async (reaction: MessageReaction | PartialMessageReaction, user: PartialUser | User) => {
	if (reaction.emoji.name !== 'muah') {
		return;
	}

	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Error fetching full information for reaction:', error);
		}
	}

	const matchingEntry = await prisma.entry.findUnique({
		where: {
			messageId: reaction.message.id,
		},
	});

	if (matchingEntry === null) {
		return;
	}

	await prisma.entry.update({
		where: {
			messageId: reaction.message.id,
		},
		data: {
			reacts: reaction.count ?? 0,
		},
	});
};
