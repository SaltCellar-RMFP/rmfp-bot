import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { isRMFPOwner, isRMFPOwnerFilter } from '../../common/isRMFPOwner.js';
import { prisma } from '../../common/prisma.js';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) => subCommand.setName('endSeason').setDescription('Ends this season of RMFP.'),
	name: 'season',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may end a season.',
				ephemeral: true,
			});
			return;
		}

		const currentSeason = await prisma.season.current();

		if (currentSeason === null) {
			await interaction.reply({
				content: "There's no ongoing RMFP season to end. Have you run `/rmfp start season`?",
				ephemeral: true,
			});
			return;
		}

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

		const response = await interaction.reply({
			content: "You're about to end the current season of RMFP. Are you sure you want to do this?",
			ephemeral: true,
			components: [actionRow],
		});

		try {
			const confirmation = await response.awaitMessageComponent({ filter: isRMFPOwnerFilter });

			if (confirmation.customId === confirmButtonId) {
				await prisma.season.update({
					where: {
						number: currentSeason.number,
					},
					data: {
						completed: true,
					},
				});
				await confirmation.update({
					content: 'The current season of RMFP has ended.',
					components: [],
				});
			} else {
				await confirmation.update({
					content: 'Action cancelled.',
					components: [],
				});
			}
		} catch {
			await interaction.editReply({
				content: 'Confirmation not received within 1 minute, cancelling',
				components: [],
			});
		}
	},
} satisfies SubCommand;
