import { Temporal, toTemporalInstant } from '@js-temporal/polyfill';
import type { Season, Week } from '@prisma/client';
import type { Awaitable, ButtonInteraction, CacheType, ChatInputCommandInteraction } from 'discord.js';
import {
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	GuildScheduledEventPrivacyLevel,
	GuildScheduledEventEntityType,
} from 'discord.js';
import { generateText } from '../../../common/generateText.js';
import { isRMFPOwnerFilter, isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

const THEME_OPTION = 'theme';
const LAST_WEEKS_WINNER_OPTION = 'last_winner';

const confirmEndCurrentWeek = async (
	currentSeason: Season,
	currentWeek: Week,
	interaction: ChatInputCommandInteraction<CacheType>,
) => {
	const confirmButtonId = 'confirm';
	const cancelButtonId = 'cancel';
	const confirmButton = new ButtonBuilder()
		.setCustomId(confirmButtonId)
		.setLabel('Confirm')
		.setStyle(ButtonStyle.Danger);
	const cancelButton = new ButtonBuilder()
		.setCustomId(cancelButtonId)
		.setLabel('Cancel')
		.setStyle(ButtonStyle.Secondary);
	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

	const response = await interaction.reply({
		content: "There's already an RMFP week ongoing. Do you want to end the current week and start a new one?",
		ephemeral: true,
		components: [actionRow],
	});

	try {
		const confirmation = await response.awaitMessageComponent({
			filter: isRMFPOwnerFilter,
			time: 60_000,
		});
		if (confirmation.customId === confirmButtonId) {
			const now = new Date();
			// End current week
			await prisma.week.update({
				where: {
					id: currentWeek.id,
				},
				data: {
					end: now,
				},
			});

			if (currentWeek.eventId === null) {
				console.warn(`There was no event linked to RMFP S${currentSeason.number}W${currentWeek.number}`);
				return;
			}

			const scheduledEvent = await interaction.guild!.scheduledEvents.fetch(currentWeek.eventId);
			if (scheduledEvent === null) {
				console.warn(
					`RMFP S${currentSeason.number}W${currentWeek.number} had an event ID, but no matching Discord ScheduledEvent was found.`,
				);
				return;
			}

			await scheduledEvent.setDescription(generateText(currentWeek, Temporal.ZonedDateTime.from(now.toISOString())));
			await scheduledEvent.setScheduledEndTime(now);

			await confirmation.update({
				content: 'The current week has been ended.',
				components: [],
			});
		} else if (confirmation.customId === cancelButtonId) {
			await confirmation.update({
				content: 'Action cancelled.',
				components: [],
			});
		}
	} catch {
		await interaction.editReply({
			content: 'Confirmation not received within 1 minute, cancelling',
			components: [],
		});
	}
};

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('week')
			.setDescription('Starts a new week of RMFP.')
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

		const currentSeason = await prisma.season.current();

		if (currentSeason === null) {
			await interaction.reply({
				content:
					"There's no RMFP season ongoing. You need to start a season (`/rmfp start season`) before running this command.",
				ephemeral: true,
			});
			return;
		}

		const now = new Date();
		const currentWeek = await prisma.week.current();

		if (currentWeek !== null) {
			await confirmEndCurrentWeek(currentSeason, currentWeek, interaction);
		}

		const theme = interaction.options.getString(THEME_OPTION, true);

		const start = Temporal.Now.zonedDateTimeISO('America/Chicago').add({ seconds: 30 });
		const end = start.with({ hour: 10, minute: 0, second: 0, millisecond: 0, microsecond: 0 }).add({ weeks: 1 });

		// Create new week
		const newWeek = await prisma.week.create({
			data: {
				theme,
				number: currentSeason.weeks.length + 1,
				seasonNumber: currentSeason.number,
				start: new Date(start.epochMilliseconds),
				end: new Date(end.epochMilliseconds),
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
	},
} satisfies SubCommand;
