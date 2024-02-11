import { PrismaClient } from '@prisma/client';
import type { Message } from 'discord.js';
import { Events } from 'discord.js';
import { getLatestWeek } from '../common/getLatestWeek.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageDelete,
	once: false,
	async execute(message: Message) {
		const prisma = new PrismaClient();
		const latestWeek = await getLatestWeek(prisma);

		if (latestWeek === null) {
			return;
		}

		await prisma.entry.delete({
			where: {
				entryId: {
					userId: message.author.id,
					weekNumber: latestWeek.number,
				},
			},
		});
	},
} satisfies Event<Events.MessageDelete>;
