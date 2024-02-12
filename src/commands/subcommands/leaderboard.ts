import { Temporal } from '@js-temporal/polyfill';
import type { GuildScheduledEvent } from 'discord.js';
import { generateText } from '../../common/announcementText.js';
import { getLatestWeek } from '../../common/getLatestWeek.js';
import { isRMFPOwner } from '../../common/isRMFPOwner.js';
import { prisma } from '../../common/prisma.js';
import type { SubCommand } from './index.js';

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
		await interaction.reply('🛑');
	},
} satisfies SubCommand;
