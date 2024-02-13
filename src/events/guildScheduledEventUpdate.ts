import process from 'node:process';
import { GuildScheduledEventStatus, Events } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Event } from './index.js';

export default {
	name: Events.GuildScheduledEventUpdate,
	once: false,
	async execute(_, newEventState) {
		if (
			newEventState.status === GuildScheduledEventStatus.Active ||
			newEventState.status === GuildScheduledEventStatus.Scheduled
		) {
			return;
		}

		if (newEventState.status === GuildScheduledEventStatus.Canceled) {
			// If the event was canceled, we need to delete the corresponding week internally as well to
			// keep things synchronized.
			await prisma.week.delete({
				where: {
					eventId: newEventState.id,
				},
			});
			return;
		}

		const matchingWeek = await prisma.week.findUnique({
			where: {
				eventId: newEventState.id,
			},
		});

		if (matchingWeek === null) {
			return;
		}

		if (newEventState.scheduledEndTimestamp === null) {
			console.error(
				`Found an RMFP week (S${matchingWeek.seasonNumber}W${matchingWeek.number}) with a corresponding event with no scheduled end date.`,
			);
			return;
		}

		const now = new Date();
		if (newEventState.scheduledEndTimestamp >= now.getTime()) {
			// If the event was terminated before running to completion,
			// it should be considered cancelled, and deleted from the db.
			await prisma.week.delete({
				where: {
					eventId: newEventState.id,
				},
			});
			return;
		}

		// If the event ran fully to completion...
		// Make an announcement of the winner!
		const winners = await prisma.week.winners(matchingWeek.id);
		const winningIds = winners.map((winner) => winner.messageId);
		await prisma.entry.updateMany({
			where: {
				messageId: {
					in: winningIds,
				},
			},
			data: {
				winnerBonus: 2,
			},
		});

		const rmfpChannel = await newEventState.guild!.channels.fetch(process.env.CHANNEL_ID!);
		if (rmfpChannel === null || !rmfpChannel.isTextBased()) {
			console.error(`Error fetching RMFP channel when announcing winners.`);
			return;
		}

		if (winners.length >= 1) {
			// Edge case: Tie
			const winnersLines = winners.map(
				(row, idx) => `${idx + 1}. <@${row.userId}>: [${row.reacts}](${row.messageUrl})`,
			);

			const content = [`# RMFP S${matchingWeek.seasonNumber}W${matchingWeek.number} has ended!`, "‼️ There's a tie ‼️"]
				.concat(winnersLines)
				.concat(['\n', "We'll need to hold a tiebreaker to figure out who chooses next week's theme!"]);

			await rmfpChannel.send({
				content: content.join('\n'),
			});

			return;
		}

		const winner = winners[0];

		const content = [
			`# RMFP S${matchingWeek.seasonNumber}W${matchingWeek.number} has ended!`,
			`Congratulations to <@${winner.userId}>'s [entry, with ${winner.reacts} :muah:s!](${winner.messageUrl})`,
			`<@${winner.userId}>, you get to pick next week's theme! 🎉`,
		];

		await rmfpChannel.send({
			content: content.join('\n'),
		});
	},
} satisfies Event<Events.GuildScheduledEventUpdate>;
