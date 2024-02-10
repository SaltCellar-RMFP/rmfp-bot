import { SlashCommandBuilder } from 'discord.js';
import leaderboard from './subcommands/leaderboard.js';
import start from './subcommands/start.js';
import type { Command } from './index.js';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Perform various RMFP-related tasks.')
		.addSubcommand(start.subCommandOption)
		.addSubcommand(leaderboard.subCommandOption)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case start.name:
				await start.execute(interaction);
				break;
			case leaderboard.name:
				await leaderboard.execute(interaction);
				break;
			default:
				break;
		}
	},
} satisfies Command;
