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
			.setDescription('Starts a new week of RMFP!')
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

		const currentSeason = await getCurrentSeason();
		if (currentSeason === null) {
			await interaction.reply("Cannot start a new RMFP week when there aren't any seasons ongoing!");
			return;
		}

		const start = Temporal.Now.instant().add({ minutes: 1 });
		const end = start
			.toZonedDateTimeISO(Temporal.Now.timeZoneId())
			.with({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 0 })
			.add({ weeks: 1 });

		const newTheme = interaction.options.getString(THEME_OPTION, true);

		const newWeek = await prisma.week.create({
			data: {
				seasonNumber: currentSeason.number,
				start: new Date(start.epochMilliseconds),
				end: new Date(end.epochMilliseconds),
				theme: newTheme,
			},
		});

		// PART 2:
		// Create an event

		const eventText = generateText(newWeek, newTheme, end, false);

		const scheduledEvent = await interaction.guild?.scheduledEvents.create({
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

		await prisma.week.update({
			where: {
				number: newWeek.number,
			},
			data: {
				eventId: scheduledEvent?.id,
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
