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
			.setName('extend')
			.setDescription('Starts a new week of RMFP!')
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

		const latestWeek = await getLatestWeek(prisma);
		if (latestWeek === null) {
			await interaction.reply({
				content: "There's no active RMFP!",
				ephemeral: true,
			});
			return;
		}

		const daysExtension = interaction.options.getInteger('days', true);

		const extendedEnd = Temporal.Instant.fromEpochMilliseconds(latestWeek.end.getTime())
			.toZonedDateTimeISO(Temporal.Now.timeZoneId())
			.add({ days: daysExtension });
		await prisma.week.update({
			where: {
				number: latestWeek.number,
			},
			data: {
				end: new Date(extendedEnd.epochMilliseconds),
			},
		});

		await interaction.reply({ content: `Okay, I've extended RMFP by ${daysExtension} days.`, ephemeral: true });

		// eslint-disable-next-line no-warning-comments
		// TODO: Find active event and update end time

		let correspondingEvent: GuildScheduledEvent | null = null;

		if (latestWeek.eventId !== null) {
			correspondingEvent = await interaction.guild!.scheduledEvents.fetch(latestWeek.eventId);
		}

		await correspondingEvent?.setScheduledEndTime(new Date(extendedEnd.epochMilliseconds));
		await correspondingEvent?.setDescription(generateText(latestWeek, latestWeek.theme, extendedEnd));
	},
} satisfies SubCommand;
