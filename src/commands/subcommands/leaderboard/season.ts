import { PrismaClient } from '@prisma/client';
import type { SubCommand } from '../index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand.setName('season').setDescription('Calculates the current standings for this season of RMFP!'),
	name: 'season',
	async execute(interaction) {
		const prisma = new PrismaClient();

		const result = await prisma.entry.groupBy({
			by: ['userId'],
			_sum: {
				reacts: true,
			},
			orderBy: {
				_sum: { reacts: 'desc' },
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
