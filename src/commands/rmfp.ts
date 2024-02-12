import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import extend from './subcommands/extend.js';
import seasonLeaderboard from './subcommands/leaderboard/season.js';
import weekLeaderboard from './subcommands/leaderboard/week.js';
import startSeason from './subcommands/start/season.js';
import startWeek from './subcommands/start/week.js';
import type { Command } from './index.js';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Perform various RMFP-related tasks.')
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName('start')
				.setDescription('Start a new RMFP session')
				.addSubcommand(startSeason.subCommandOption)
				.addSubcommand(startWeek.subCommandOption),
		)
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName('leaderboard')
				.setDescription('Leaderboard calculations')
				.addSubcommand(seasonLeaderboard.subCommandOption)
				.addSubcommand(weekLeaderboard.subCommandOption),
		)
		.addSubcommand(extend.subCommandOption)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case startSeason.name:
				await startSeason.execute(interaction);
				break;
			case startWeek.name:
				await startWeek.execute(interaction);
				break;
			case seasonLeaderboard.name:
				await seasonLeaderboard.execute(interaction);
				break;
			case weekLeaderboard.name:
				await weekLeaderboard.execute(interaction);
				break;
			case extend.name:
				await extend.execute(interaction);
				break;
			default:
				break;
		}
	},
} satisfies Command;
