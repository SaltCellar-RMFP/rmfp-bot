import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isRMFPOwnerFilter, isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

/**
 * Begins a new RMFP season. Informs the user if one is ongoing that they must invoke `/rmfp season end` first.
 */
export default {
	subCommandOption: (subCommand) => subCommand.setName('start').setDescription('Starts a new season of RMFP!'),
	name: 'start',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new season.',
				ephemeral: true,
			});
			return;
		}

		const currentSeason = await prisma.season.current();

		if (currentSeason !== null) {
			// We can't have two seasons of RMFP going at once, the admin must end the current season first.
			await interaction.reply({
				content:
					"A new season of RMFP can't be started until the current season has been ended! Use `/rmfp season end` to end the current season.",
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
			content: "You're about to start a new season of RMFP. Are you sure you want to do this?",
			ephemeral: true,
			components: [actionRow],
		});

		try {
			const confirmation = await response.awaitMessageComponent({ filter: isRMFPOwnerFilter, time: 60_000 });

			if (confirmation.customId === confirmButtonId) {
				const newSeason = await prisma.season.create({
					data: {},
				});
				await confirmation.update({
					content: `RMFP Season ${newSeason.number} has started!`,
					components: [],
				});
			} else if (confirmation.customId === cancelButtonId) {
				await confirmation.update({
					content: 'Action cancelled',
					components: [],
				});
			}
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
		}
	},
} satisfies SubCommand;
