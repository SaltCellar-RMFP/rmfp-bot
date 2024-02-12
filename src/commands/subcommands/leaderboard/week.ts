import { getLatestWeek } from '../../../common/getLatestWeek.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('week')
			.setDescription('Calculates the current standings for a week of RMFP!')
			.addIntegerOption((option) =>
				option
					.setName('week_number')
					.setDescription('The week to calculate standings for')
					.setMinValue(1)
					.setRequired(false),
			),
	name: 'week',
	async execute(interaction) {
		let weekNumber = interaction.options.getInteger('week_number');
		if (weekNumber === null) {
			const latestWeek = await getLatestWeek(prisma);
			if (!latestWeek) {
				console.error("A user attempted to fetch the latest week's leaderboard, but no weeks were active!");
				await interaction.reply("There's no RMFP active right now. Try again later.");
				return;
			}

			weekNumber = latestWeek.number;
		}

		const result = await prisma.entry.groupBy({
			by: ['userId', 'messageUrl'],
			where: {
				weekNumber,
			},
			_sum: {
				reacts: true,
			},
			orderBy: {
				_sum: {
					reacts: 'desc',
				},
			},
		});

		const content = [`# RMFP Week ${weekNumber}`];

		for (const [idx, row] of result.entries()) {
			content.push(`${idx}. <@${row.userId}>: [${row._sum.reacts}](${row.messageUrl})`);
		}

		await interaction.reply({
			content: content.join('\n'),
			ephemeral: true,
		});
	},
} satisfies SubCommand;
