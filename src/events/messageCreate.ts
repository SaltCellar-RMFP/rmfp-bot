import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import type { Message } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } from 'discord.js';
import { getLatestWeek } from '../common/getLatestWeek.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (process.env.APPLICATION_ID === undefined) {
			console.error('The APPLICATION_ID environment variable was not set.');
			return;
		}

		if (process.env.CHANNEL_ID === undefined) {
			console.error('The CHANNEL_ID environment variable was not set.');
			return;
		}

		if (!message.mentions.has(message.client.application.id)) {
			return;
		}

		if (message.channelId !== process.env.CHANNEL_ID) {
			console.log('mismatch channel');
		}

		const prisma = new PrismaClient();
		const latestWeek = await getLatestWeek(prisma);
		if (latestWeek === null) {
			await message.react('👎');
			return;
		}

		const existingEntry = await prisma.entry.findUnique({
			where: {
				entryId: {
					userId: message.author.id,
					weekNumber: latestWeek.number,
				},
			},
		});

		if (existingEntry !== null) {
			const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Replace').setStyle(ButtonStyle.Danger);
			const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);
			const warningMessage = await message.reply({
				content: "You've already entered this week's RMFP. Do you want to replace your entry?",
				components: [row],
			});
			try {
				const confirmation = await warningMessage.awaitMessageComponent({
					filter: (interaction) => interaction.user.id === message.author.id,
					time: 60_000,
				});

				if (confirmation.customId === 'confirm') {
					await prisma.entry.update({
						where: {
							entryId: {
								userId: message.author.id,
								weekNumber: latestWeek.number,
							},
						},
						data: {
							messageId: message.id,
							messageUrl: message.url,
							reacts: 0,
						},
					});
					await confirmation.update({ content: 'Entry replaced.', components: [] });
				} else if (confirmation.customId === 'cancel') {
					await confirmation.update({ content: 'Cancelling', components: [] });
				}

				return;
			} catch {
				await warningMessage.edit({
					content: 'Confirmation not received within 1 minute, cancelling',
					components: [],
				});
				return;
			}
		}

		await prisma.entry.create({
			data: {
				userId: message.author.id,
				weekNumber: latestWeek.number,
				messageId: message.id,
				messageUrl: message.url,
				reacts: 0,
			},
		});

		await message.react('👀');
	},
} satisfies Event<Events.MessageCreate>;
