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

		await prisma.entry.delete({
			where: {
				messageId: message.id,
			},
		});
	},
} satisfies Event<Events.MessageDelete>;
