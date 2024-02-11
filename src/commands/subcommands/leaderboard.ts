import { PrismaClient } from '@prisma/client';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand.setName('leaderboard').setDescription('Calculates the current standings for this season of RMFP!'),
	name: 'leaderboard',
	async execute(interaction) {
		const prisma = new PrismaClient();
	},
} satisfies SubCommand;
