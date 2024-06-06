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
			firstTimeBonus: true,
			winnerBonus: true,
		},
		_count: {
			userId: true,
		},
	});

	const results = entries
		.map((entry) => {
			return {
				userId: entry.userId,
				points: entry._sum.firstTimeBonus! + entry._count.userId! + entry._sum.winnerBonus!,
			};
		})
		.sort((a, b) => b.points - a.points);

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
	const week = await prisma.week.findFirst({
		where: {
			number: weekNumber,
			seasonNumber,
		},
	});

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

	if (week === null) {
		await interaction.reply({
			content: `Hm... I can't find any entries for S${seasonNumber}W${weekNumber}`,
			ephemeral: true,
		});
		return;
	}

	const response = [`# RMFP Season ${seasonNumber} Week ${weekNumber}`, `**Theme**: ${week.theme}`];

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
			const currentSeason = await prisma.season.current();

			if (currentSeason === null) {
				await interaction.reply(
					"Because you didn't specify a season number, I tried to look up data for the current season. However, it doesn't look like there is a current season: try specifying a season number instead.",
				);
				return;
			}

			seasonNumber = currentSeason.number;
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
