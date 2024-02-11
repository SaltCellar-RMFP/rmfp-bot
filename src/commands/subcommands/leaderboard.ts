import { PrismaClient } from '@prisma/client';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand.setName('leaderboard').setDescription('Calculates the current standings for this season of RMFP!'),
	name: 'leaderboard',
	async execute(interaction) {
		const prisma = new PrismaClient();

		const result = await prisma.entry.groupBy({
			by: ['userId'],
			_sum: {
				reacts: true,
			},
		});

		const content = [`# RMFP Season ${3}`];

		for (const [idx, row] of result.entries()) {
			content.push(`${idx}. <@${row.userId}>: ${row._sum.reacts}`);
		}

		await interaction.reply({
			content: content.join('\n'),
			ephemeral: true,
		});
	},
} satisfies SubCommand;
