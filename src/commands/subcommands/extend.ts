import { Temporal } from '@js-temporal/polyfill';
import { generateText } from '../../common/generateText.js';
import { isRMFPOwner } from '../../common/isRMFPOwner.js';
import { prisma } from '../../common/prisma.js';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('extend')
			.setDescription('Extends the current week of RMFP.')
			.addIntegerOption((option) =>
				option
					.setName('days')
					.setDescription("The number of days to extend this week's RMFP by")
					.setRequired(true)
					.setMinValue(0),
			),
	name: 'extend',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may extend RMFP.',
				ephemeral: true,
			});
		}

		const days = interaction.options.getInteger('days', true);

		const currentWeek = await prisma.week.current();

		if (currentWeek === null) {
			await interaction.reply({ content: "There's no active RMFP week to extend.", ephemeral: true });
			return;
		}

		const newEnd = Temporal.Instant.fromEpochMilliseconds(currentWeek.end.getTime())
			.toZonedDateTimeISO(Temporal.Now.timeZoneId())
			.add({ days });

		await prisma.week.update({
			where: {
				id: currentWeek.id,
			},
			data: {
				end: new Date(newEnd.epochMilliseconds),
			},
		});

		if (currentWeek.eventId === null) {
			console.warn(
				`Attempted to extend RMFP event S${currentWeek.seasonNumber}W${currentWeek.number}, but there wasn't a Discord ScheduledEvent ID attached`,
			);
			return;
		}

		const scheduledEvent = await interaction.guild!.scheduledEvents.fetch(currentWeek.eventId);

		if (scheduledEvent === null) {
			console.warn(
				`Attempted to extend RMFP event S${currentWeek.seasonNumber}W${currentWeek.number}, but there wasn't a corresponding Discord ScheduledEvent with ID ${currentWeek.eventId}`,
			);
			return;
		}

		await scheduledEvent.setDescription(generateText(currentWeek, newEnd), 'extension');
		await scheduledEvent.setScheduledEndTime(new Date(newEnd.epochMilliseconds), 'extension');

		await interaction.reply({
			content: `The current week has been extended by ${days} days.`,
			ephemeral: true,
		});
	},
} satisfies SubCommand;
