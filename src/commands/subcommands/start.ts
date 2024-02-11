import process from 'node:process';
import { Temporal } from '@js-temporal/polyfill';
import type { Week } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import {
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	type APIInteractionGuildMember,
	type Guild,
	type GuildMember,
} from 'discord.js';
import rmfp from '../rmfp.js';
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

const generateText = (week: Week, theme: string, deadline: Temporal.ZonedDateTime, includeHeader = false): string => {
	const content: string[] = [];
	if (includeHeader) {
		content.push(`# RMFP Week ${week.number}`);
	}

	content.push(
		`**Theme**: ${theme}`,
		`## **Rules**:`,
		`- 1 point for submission`,
		`- 3 points for first-time participants`,
		`- 2 points for highest :muah: count`,
		`- Entries must be submitted by ${deadline.toLocaleString()} ${deadline.timeZoneId}`,
	);
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

		const start = Temporal.Now.instant().add({ minutes: 1 });
		const end = start
			.toZonedDateTimeISO(Temporal.Now.timeZoneId())
			.with({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 0 })
			.add({ weeks: 1 });

		const newTheme = interaction.options.getString(THEME_OPTION, true);
		const prisma = new PrismaClient();

		const newWeek = await prisma.week.create({
			data: {
				start: new Date(start.epochMilliseconds),
				end: new Date(end.epochMilliseconds),
				theme: newTheme,
			},
		});

		// PART 2:
		// Create an event

		const eventText = generateText(newWeek, newTheme, end, false);

		await interaction.guild?.scheduledEvents.create({
			name: `RMFP: Week ${newWeek.number}`,
			description: eventText,
			scheduledStartTime: new Date(start.epochMilliseconds),
			privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
			entityType: GuildScheduledEventEntityType.External,
			scheduledEndTime: new Date(end.epochMilliseconds),
			entityMetadata: {
				location: '#rmfp',
			},
		});

		// PART 3:
		// Send a formal announcement announcing that RMFP has started
		const announcementText = generateText(newWeek, newTheme, end, true);
		const interactionResponse = await interaction.reply({ content: announcementText });
		const announcement = await interactionResponse.fetch();

		// PART 4:
		// Pin the announcement
		await announcement.pin();
	},
} satisfies SubCommand;
