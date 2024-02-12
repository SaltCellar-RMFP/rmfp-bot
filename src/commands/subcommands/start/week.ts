import { Temporal } from '@js-temporal/polyfill';
import { GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } from 'discord.js';
import { generateText } from '../../../common/announcementText.js';
import { getCurrentSeason } from '../../../common/getCurrentSeason.js';
import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

const THEME_OPTION = 'theme';
const LAST_WEEKS_WINNER_OPTION = 'last_winner';

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('week')
			.setDescription('Starts a new week of RMFP for the current season.')
			.addStringOption((option) =>
				option.setName(THEME_OPTION).setDescription("What's this week's theme?").setRequired(true),
			)
			.addUserOption((option) =>
				option.setName(LAST_WEEKS_WINNER_OPTION).setDescription("Who won last week's RMFP?").setRequired(false),
			),
	name: 'week',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new week.',
				ephemeral: true,
			});
			return;
		}

		await interaction.reply('🚧');
	},
} satisfies SubCommand;
