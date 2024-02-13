import process from 'node:process';
import type { Message } from 'discord.js';
import { ActionRowBuilder, ButtonStyle, Events, ButtonBuilder } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (
			!message.mentions.has(process.env.APPLICATION_ID!) ||
			message.guildId !== process.env.GUILD_ID! ||
			message.channelId !== process.env.CHANNEL_ID!
		) {
			return;
		}

		const currentWeek = await prisma.week.current();
		if (currentWeek === null) {
			return;
		}

		const correspondingEntry = await prisma.entry.findUnique({
			where: {
				userId_weekId: {
					userId: message.author.id,
					weekId: currentWeek.id,
				},
			},
		});

		if (correspondingEntry !== null) {
			const confirmButtonId = 'confirm';
			const cancelButtonId = 'cancel';
			const confirmButton = new ButtonBuilder()
				.setCustomId(confirmButtonId)
				.setLabel('Confirm')
				.setStyle(ButtonStyle.Danger);
			const cancelButton = new ButtonBuilder()
				.setCustomId(cancelButtonId)
				.setLabel('Cancel')
				.setStyle(ButtonStyle.Secondary);
			const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

			const response = await message.reply({
				content:
					"You've already made an entry into RMFP for this week. Would you like to replace your current entry? You'll lose the points you've collected thus far.",
				components: [actionRow],
			});

			try {
				const confirmation = await response.awaitMessageComponent({
					filter: (interaction) => interaction.user.id === message.author.id,
				});

				if (confirmation.customId === confirmButtonId) {
					await prisma.entry.delete({
						where: {
							userId_weekId: {
								userId: message.author.id,
								weekId: currentWeek.id,
							},
						},
					});
					await confirmation.update({
						content: 'Your entry has been replaced.',
						components: [],
					});
				} else {
					await confirmation.update({
						content: 'Action cancelled.',
						components: [],
					});
				}
			} catch {
				await response.edit({
					content: 'Confirmation not received within 1 minute, cancelling',
					components: [],
				});
			}
		}

		await prisma.entry.create({
			data: {
				messageId: message.id,
				messageUrl: message.url,
				weekId: currentWeek.id,
				userId: message.author.id,
				reacts: 0,
			},
		});

		await message.react('👀');
	},
} satisfies Event<Events.MessageCreate>;
