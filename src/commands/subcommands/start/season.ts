import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand.setName('season').setDescription('Calculates the current standings for this season of RMFP!'),
	name: 'season',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new week.',
				ephemeral: true,
			});
			return;
		}

		const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Replace').setStyle(ButtonStyle.Danger);
		const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);
		const warningMessage = await interaction.reply({
			content: 'Are you sure you want to start a new season?',
			components: [row],
		});
		try {
			const confirmation = await warningMessage.awaitMessageComponent({
				filter: (intxn) => intxn.user.id === interaction.user.id,
				time: 60_000,
			});

			if (confirmation.customId === 'confirm') {
				await prisma.season.create({});
				await confirmation.update({ content: 'Starting a new season!', components: [] });
			} else if (confirmation.customId === 'cancel') {
				await confirmation.update({ content: 'Cancelling', components: [] });
			}
		} catch {
			await warningMessage.edit({
				content: 'Confirmation not received within 1 minute, cancelling',
				components: [],
			});
		}
	},
} satisfies SubCommand;
