import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { prisma } from '../common/prisma.js';

export const updateRMFPScore = async (reaction: MessageReaction | PartialMessageReaction, user: PartialUser | User) => {
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
			reacts: reaction.count!,
		},
	});
};
