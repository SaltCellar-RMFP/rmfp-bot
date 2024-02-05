import { SlashCommandBuilder } from 'discord.js';
import start from './subcommands/start.js';
import type { Command } from './index.js';

export const THEME_OPTION = 'theme';
export const LAST_WEEKS_WINNER_OPTION = 'last_winner';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Perform various RMFP-related tasks.')
		.addSubcommand(start.subCommandOption)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case start.name:
				await start.execute(interaction);
				break;
			default:
				break;
		}
	},
} satisfies Command;
