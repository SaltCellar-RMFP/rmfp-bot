import process from 'node:process';
import type { APIInteractionGuildMember, Guild, GuildMember } from 'discord.js';
import { DateTime } from 'luxon';
import { RMFPSheetController } from '../../sheets/RMFPSheetController.js';
import { authorize } from '../../sheets/index.js';
import type { SubCommand } from './index.js';

const THEME_OPTION = 'theme';
const LAST_WEEKS_WINNER_OPTION = 'last_winner';

const isRMFPOwner = (guild: Guild | null, member: APIInteractionGuildMember | GuildMember | null): boolean => {
	if (process.env.RMFP_OWNER_ROLE_ID === undefined) {
		console.error(`Error: no RMFP_OWNER_ROLE_ID was provided.`);
		return false;
	}

	if (member === null) {
		console.warn(`Can't verify if null is the RMFP Owner`);
		return false;
	}

	const rmfpOwnerRole = guild?.roles.cache.get(process.env.RMFP_OWNER_ROLE_ID);

	if (rmfpOwnerRole === undefined) {
		console.error(`Guild ${guild?.name} does not have a role with ID ${process.env.RMFP_OWNER_ROLE_ID}`);
		return false;
	}

	try {
		return (member as GuildMember).roles.cache.get(rmfpOwnerRole.id) !== undefined;
	} catch {
		return (member as APIInteractionGuildMember).roles.includes(rmfpOwnerRole.id) ?? false;
	}
};

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
	const content: string[] = [];
	if (includeHeader) {
		content.push(`# RMFP Week ${weekNumber}`);
	}

	content.push(`**Theme**: ${theme}`);

	if (lastWeek !== undefined) {
		content.push(`**Week ${lastWeek.number}**: ${theme} (Winner: <@${lastWeek.winner}>)`);
	}

	content.concat([
		`## **Rules**:`,
		`- 1 point for submission`,
		`- 3 points for first-time participants`,
		`- 2 points for highest :muah: count`,
		`- Entries must be submitted by ${deadline.toLocaleString(DateTime.DATETIME_SHORT)} ${deadline.zoneName ?? ''}`,
	]);
	return content.join('\n');
};

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('start')
			.setDescription('Starts a new week of RMFP!')
			.addStringOption((option) =>
				option.setName(THEME_OPTION).setDescription("What's this week's theme?").setRequired(true),
			)
			.addUserOption((option) =>
				option.setName(LAST_WEEKS_WINNER_OPTION).setDescription("Who won last week's RMFP?").setRequired(false),
			),
	name: 'start',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may start a new week.',
				ephemeral: true,
			});
			return;
		}

		const sheetsClient = await authorize();

		const rmfp = new RMFPSheetController(sheetsClient, process.env.SPREADSHEET_ID!);
		// PART 1:
		// Create a new row in the Google Sheet
		// Rows: Weeks (start @ A2, values = week number)
		// Columns: Discord usernames
		const newTheme = interaction.options.getString(THEME_OPTION, true);
		const newWeek = await rmfp.startNewWeek(newTheme);

		// PART 2:
		// Create an event
		const lastWeeksWinner = interaction.options.getUser(LAST_WEEKS_WINNER_OPTION);
		const lastWeeksTheme = await rmfp.getThemeForWeek(newWeek - 1);

		const scheduledStartTime = DateTime.now().plus({ minute: 1 });
		const scheduledEndTime = DateTime.now()
			.setZone('America/Chicago')
			.startOf('day')
			.plus({ week: 1 })
			.set({ hour: 10, minute: 0, second: 0 });

		// const eventText = generateText(
		// 	newWeek,
		// 	newTheme,
		// 	scheduledEndTime,
		// 	false,
		// 	lastWeeksWinner && lastWeeksTheme
		// 		? {
		// 				winner: lastWeeksWinner.id,
		// 				number: newWeek - 1,
		// 				theme: lastWeeksTheme,
		// 			}
		// 		: undefined,
		// );

		// await interaction.guild?.scheduledEvents.create({
		// 	name: `RMFP: Week ${await rmfp.latestWeek()}`,
		// 	description: eventText,
		// 	scheduledStartTime: scheduledStartTime.toJSDate(),
		// 	privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
		// 	entityType: GuildScheduledEventEntityType.External,
		// 	scheduledEndTime: scheduledEndTime.toJSDate(),
		// 	entityMetadata: {
		// 		location: '#rmfp',
		// 	},
		// });

		// PART 3:
		// Send a formal announcement announcing that RMFP has started
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
		const interactionResponse = await interaction.reply({ content: announcementText });
		const announcement = await interactionResponse.fetch();

		// PART 4:
		// Pin the announcement
		await announcement.pin();
	},
} satisfies SubCommand;
