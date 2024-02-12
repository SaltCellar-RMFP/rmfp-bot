import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import type { SubCommand } from '../index.js';

const THEME_OPTION = 'theme';
const LAST_WEEKS_WINNER_OPTION = 'last_winner';

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('week')
			.setDescription('Starts a new week of RMFP.')
			.addStringOption((option) =>
				option.setName(THEME_OPTION).setDescription("What's this week's theme?").setRequired(true),
			)
			.addUserOption((option) =>
				option.setName(LAST_WEEKS_WINNER_OPTION).setDescription("Who won last week's RMFP?").setRequired(false),
			),
	name: 'week',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new week.',
				ephemeral: true,
			});
			return;
		}

		await interaction.reply('🚧');
	},
} satisfies SubCommand;
