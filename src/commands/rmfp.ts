import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import type { SubCommand } from './subcommands/index.js';
import leaderboard from './subcommands/leaderboard.js';
import endSeason from './subcommands/season/end.js';
import startSeason from './subcommands/season/start.js';
import uploadHistory from './subcommands/upload_history.js';
import endWeek from './subcommands/week/end.js';
import extend from './subcommands/week/extend.js';
import startWeek from './subcommands/week/start.js';
import type { Command } from './index.js';

const seasonCommands = new Map<string, SubCommand>([
	[startSeason.name, startSeason],
	[endSeason.name, endSeason],
]);

const weekCommands = new Map<string, SubCommand>([
	[startWeek.name, startWeek],
	[endWeek.name, endWeek],
	[extend.name, extend],
]);

const miscCommands = new Map<string, SubCommand>([
	[leaderboard.name, leaderboard],
	[uploadHistory.name, uploadHistory],
]);

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Perform various RMFP-related tasks.')
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName('season')
				.setDescription('Controls an RMFP season.')
				.addSubcommand(startSeason.subCommandOption)
				.addSubcommand(endSeason.subCommandOption),
		)
		.addSubcommandGroup(
			new SlashCommandSubcommandGroupBuilder()
				.setName('week')
				.setDescription('Controls an RMFP week.')
				.addSubcommand(startWeek.subCommandOption)
				.addSubcommand(extend.subCommandOption)
				.addSubcommand(endWeek.subCommandOption),
		)
		.addSubcommand(leaderboard.subCommandOption)
		.addSubcommand(uploadHistory.subCommandOption)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		if (interaction.options.getSubcommandGroup() === null) {
			const subCommand = miscCommands.get(interaction.options.getSubcommand());
			await subCommand?.execute(interaction);
			return;
		}

		let subCommand: SubCommand | undefined;
		if (interaction.options.getSubcommandGroup() === 'season') {
			subCommand = seasonCommands.get(interaction.options.getSubcommand());
		} else {
			subCommand = weekCommands.get(interaction.options.getSubcommand());
		}

		if (subCommand === undefined) {
			console.error(
				`Could not find a subcommand matching for "${interaction.options.getSubcommandGroup()} ${interaction.options.getSubcommand()}"`,
			);
			return;
		}

		await subCommand.execute(interaction);
	},
} satisfies Command;
