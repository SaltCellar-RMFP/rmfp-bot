import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import type { SubCommand } from '../index.js';

export default {
	subCommandOption: (subCommand) => subCommand.setName('season').setDescription('Starts a new season of RMFP!'),
	name: 'season',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new season.',
				ephemeral: true,
			});
			return;
		}

		await interaction.reply('🚧');
	},
} satisfies SubCommand;
