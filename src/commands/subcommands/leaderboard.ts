import type { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '../../common/prisma.js';
import type { SubCommand } from './index.js';

const calculateLeaderboardForSeason = async (
	seasonNumber: number,
	interaction: ChatInputCommandInteraction<CacheType>,
) => {
	const entries = await prisma.entry.groupBy({
		by: ['userId'],
		where: {
			week: {
				seasonNumber,
			},
		},
		_sum: {
			reacts: true,
			firstTimeBonus: true,
			winnerBonus: true,
		},
	});

	const results = entries
		.map((entry) => {
			return {
				userId: entry.userId,
				points: entry._sum.firstTimeBonus! + entry._sum.reacts! + entry._sum.winnerBonus!,
			};
		})
		.sort((a, b) => a.points - b.points);

	const response = [`# RMFP Season ${seasonNumber}`];
	for (const [idx, row] of results.entries()) {
		response.push(`${idx}. <@${row.userId}> : ${row.points}`);
	}

	await interaction.reply({
		content: response.join('\n'),
		ephemeral: true,
	});
};

const calculateLeaderboardForWeek = async (
	seasonNumber: number,
	weekNumber: number,
	interaction: ChatInputCommandInteraction<CacheType>,
) => {
	const entries = await prisma.entry.findMany({
		select: {
			userId: true,
			reacts: true,
			messageUrl: true,
		},
		where: {
			week: {
				number: weekNumber,
				seasonNumber,
			},
		},
		orderBy: {
			reacts: 'desc',
		},
	});

	const response = [`# RMFP Season ${seasonNumber} Week ${weekNumber}`];

	for (const [idx, entry] of entries.entries()) {
		response.push(`${idx}. <@${entry.userId}> : [${entry.reacts}](${entry.messageUrl})`);
	}

	await interaction.reply({
		content: response.join('\n'),
		ephemeral: true,
	});
};

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('leaderboard')
			.setDescription('Calculates leaderboard standings for RMFP.')
			.addIntegerOption((option) =>
				option
					.setName('season')
					.setDescription('The RMFP season to get leaderboard standings for.')
					.setRequired(false)
					.setMinValue(1),
			)
			.addIntegerOption((option) =>
				option.setName('week').setDescription('The RMFP week to get standings for.').setRequired(false).setMinValue(1),
			),
	name: 'leaderboard',
	async execute(interaction) {
		let seasonNumber = interaction.options.getInteger('season');
		const weekNumber = interaction.options.getInteger('week');

		if (seasonNumber === null) {
			const latestSeason = await prisma.season.findFirst({
				where: {
					completed: false,
				},
				orderBy: {
					number: 'desc',
				},
			});

			if (latestSeason === null) {
				await interaction.reply(
					"Because you didn't specify a season number, I tried to look up data for the current season. However, it doesn't look like there is a current season: try specifying a season number instead.",
				);
				return;
			}

			seasonNumber = latestSeason.number;
		} else {
			const matchingSeason = await prisma.season.findUnique({
				where: {
					number: seasonNumber,
				},
			});

			if (matchingSeason === null) {
				await interaction.reply(`I couldn't find RMFP Season ${seasonNumber} in my records. Try a different season.`);
				return;
			}

			seasonNumber = matchingSeason.number;
		}

		if (weekNumber === null) {
			await calculateLeaderboardForSeason(seasonNumber, interaction);
		} else {
			await calculateLeaderboardForWeek(seasonNumber, weekNumber, interaction);
		}
	},
} satisfies SubCommand;
