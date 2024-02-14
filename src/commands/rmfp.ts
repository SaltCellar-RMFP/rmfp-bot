import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import endSeason from './subcommands/endSeason.js';
import extend from './subcommands/extend.js';
import leaderboard from './subcommands/leaderboard.js';
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
		.addSubcommand(endSeason.subCommandOption)
		.addSubcommand(extend.subCommandOption)
		.addSubcommand(leaderboard.subCommandOption)
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
			case endSeason.name:
				await endSeason.execute(interaction);
				break;
			case leaderboard.name:
				await leaderboard.execute(interaction);
				break;
			case extend.name:
				await extend.execute(interaction);
				break;
			default:
				break;
		}
	},
} satisfies Command;
