import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import extend from './subcommands/extend.js';
import season from './subcommands/leaderboard/season.js';
import week from './subcommands/leaderboard/week.js';
import start from './subcommands/start.js';
import type { Command } from './index.js';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Perform various RMFP-related tasks.')
		.addSubcommand(start.subCommandOption)
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName('leaderboard')
				.setDescription('Leaderboard calculations')
				.addSubcommand(season.subCommandOption)
				.addSubcommand(week.subCommandOption),
		)
		.addSubcommand(extend.subCommandOption)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case start.name:
				await start.execute(interaction);
				break;
			case season.name:
				await season.execute(interaction);
				break;
			case week.name:
				await week.execute(interaction);
				break;
			case extend.name:
				await extend.execute(interaction);
				break;
			default:
				break;
		}
	},
} satisfies Command;
