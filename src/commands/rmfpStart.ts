import {
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	SlashCommandBuilder,
	SlashCommandStringOption,
	SlashCommandUserOption,
} from 'discord.js';
import { DateTime } from 'luxon';
import { RMFPController } from '../sheets/RMFPSheetController.js';
import { authorize } from '../sheets/index.js';
import type { Command } from './index.ts';

const generateText = (
	weekNumber: number,
	theme: string,
	deadline: DateTime,
	includeHeader = false,
	lastWeek?: {
		number: number;
		theme: string;
		winner: string;
	},
): string => {
	let content = '';
	if (includeHeader) {
		content += `# RMFP Week ${weekNumber}\n`;
	}

	content += `**Theme**: ${theme}\n`;

	if (lastWeek !== undefined) {
		content += `**Week ${lastWeek.number}**: ${theme} (Winner: <@${lastWeek.winner}>)\n`;
	}

	content += `**Rules**:\n- 1 point for submission\n- 3 points for first-time participants\n- 2 points for highest :muah: count\n- Entries must be submitted by ${deadline.toLocaleString(DateTime.DATETIME_SHORT)} ${deadline.zoneName ?? ''}`;
	return content;
};

const THEME_OPTION = 'theme';
const LAST_WEEKS_WINNER_OPTION = 'last_winner';
export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Starts a new week of RMFP!')
		.addStringOption(
			new SlashCommandStringOption()
				.setName(THEME_OPTION)
				.setDescription("What's this week's theme?")
				.setRequired(true),
		)
		.addUserOption(
			new SlashCommandUserOption()
				.setName(LAST_WEEKS_WINNER_OPTION)
				.setDescription("Who won last week's RMFP?")
				.setRequired(false),
		)
		.toJSON(),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const client = await authorize();
		const rmfp = new RMFPController(client);
		// PART 1:
		// Create a new row in the Google Sheet
		// Rows: Weeks (start @ A2, values = week number)
		// Columns: Discord usernames
		const newTheme = interaction.options.getString(THEME_OPTION, true);
		const newWeek = await rmfp.startNewWeek(newTheme);

		const lastWeeksWinner = interaction.options.getUser(LAST_WEEKS_WINNER_OPTION);
		const lastWeeksTheme = await rmfp.getThemeForWeek(newWeek - 1);

		const scheduledStartTime = DateTime.now().plus({ minute: 1 });
		const scheduledEndTime = DateTime.now()
			.setZone('America/Chicago')
			.startOf('day')
			.plus({ week: 1 })
			.set({ hour: 10, minute: 0, second: 0 });

		const announcementText = generateText(
			newWeek,
			newTheme,
			scheduledEndTime,
			true,
			lastWeeksWinner && lastWeeksTheme
				? {
						winner: lastWeeksWinner.id,
						number: newWeek - 1,
						theme: lastWeeksTheme,
					}
				: undefined,
		);

		const eventText = generateText(
			newWeek,
			newTheme,
			scheduledEndTime,
			false,
			lastWeeksWinner && lastWeeksTheme
				? {
						winner: lastWeeksWinner.id,
						number: newWeek - 1,
						theme: lastWeeksTheme,
					}
				: undefined,
		);

		// PART 2:
		// Create an event?
		await interaction.guild?.scheduledEvents.create({
			name: `RMFP: Week ${await rmfp.latestWeek()}`,
			description: eventText,
			scheduledStartTime: scheduledStartTime.toJSDate(),
			privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
			entityType: GuildScheduledEventEntityType.External,
			scheduledEndTime: scheduledEndTime.toJSDate(),
			entityMetadata: {
				location: '#rmfp',
			},
		});

		// PART 3:
		// Send a formal announcement announcing that RMFP has started

		const announcementMessage = await interaction.reply({ content: announcementText, fetchReply: true });

		await (await announcementMessage.fetch(true)).pin();
	},
} satisfies Command;
