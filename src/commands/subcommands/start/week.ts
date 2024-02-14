import process from 'node:process';
import { Temporal } from '@js-temporal/polyfill';
import type { Season, Week } from '@prisma/client';
import type { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } from 'discord.js';
import { generateText } from '../../../common/generateText.js';
import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

const THEME_OPTION = 'theme';

/**
 * Starts a new RMFP week with the provided theme. Informs the user that they must end an ongoing week, if there is one.
 */
export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('week')
			.setDescription('Starts a new week of RMFP.')
			.addStringOption((option) =>
				option.setName(THEME_OPTION).setDescription("What's this week's theme?").setRequired(true),
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

		const currentSeason = await prisma.season.current();

		if (currentSeason === null) {
			await interaction.reply({
				content:
					"There's no RMFP season ongoing. You need to start a season (`/rmfp start season`) before running this command.",
				ephemeral: true,
			});
			return;
		}

		const currentWeek = await prisma.week.current();
		const theme = interaction.options.getString(THEME_OPTION, true);
		if (currentWeek !== null) {
			await interaction.reply({
				content:
					"There's currently an RMFP week ongoing. You'll need to end that RMFP week via Discord before starting a new week.",
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({ content: 'Starting a new week!', ephemeral: true });
		await createWeek(theme, currentSeason, interaction);
	},
} satisfies SubCommand;

/**
 * Creates a new Week in the RMFP database for the current season. Also creates (and starts) an associated Discord event.
 *
 * @param theme -  The theme of the new RMFP week
 * @param currentSeason -  The current RMFP season
 * @param interaction -  The interaction we should provide feedback to
 */
async function createWeek(
	theme: string,
	currentSeason: Season & { weeks: Week[] },
	interaction: ChatInputCommandInteraction<CacheType>,
) {
	const start = Temporal.Now.zonedDateTimeISO('America/Chicago').add({ seconds: 30 });
	const end = start.with({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 0 }).add({ weeks: 1 });

	// Create new week
	const newWeek = await prisma.week.create({
		data: {
			theme,
			number: currentSeason.weeks.length + 1,
			seasonNumber: currentSeason.number,
			scheduledStart: new Date(start.epochMilliseconds),
			scheduledEnd: new Date(end.epochMilliseconds),
		},
	});

	// Create scheduled event
	const scheduledEvent = await interaction.guild!.scheduledEvents.create({
		name: `RMFP S${currentSeason.number}W${newWeek.number}`,

		description: generateText(newWeek, end),
		scheduledStartTime: new Date(start.epochMilliseconds),
		scheduledEndTime: new Date(end.epochMilliseconds),
		privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
		entityType: GuildScheduledEventEntityType.External,
		entityMetadata: {
			location: '#rmfp',
		},
	});

	await prisma.week.update({
		where: {
			id: newWeek.id,
		},
		data: {
			eventId: scheduledEvent.id,
		},
	});
	const channel = await interaction.guild!.channels.fetch(process.env.CHANNEL_ID!);
	if (channel?.isTextBased()) {
		const announcement = await channel.send(generateText(newWeek, end, true));
		await announcement.pin();
	}
}
