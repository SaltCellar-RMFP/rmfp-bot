import { isRMFPOwner } from '../../common/isRMFPOwner.js';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('extend')
			.setDescription('Extends the current week of RMFP.')
			.addIntegerOption((option) =>
				option
					.setName('days')
					.setDescription("The number of days to extend this week's RMFP by")
					.setRequired(true)
					.setMinValue(0),
			),
	name: 'extend',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may extend RMFP.',
				ephemeral: true,
			});
		}

		await interaction.reply('🚧');
	},
} satisfies SubCommand;
