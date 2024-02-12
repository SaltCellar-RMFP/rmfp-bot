import type { GuildScheduledEvent, GuildScheduledEventStatus } from 'discord.js';
import { Events } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Event } from './index.js';

export default {
	name: Events.GuildScheduledEventUpdate,
	once: false,
	async execute(possiblyPartialEvent) {
		if (possiblyPartialEvent === null) {
			return;
		}

		if (possiblyPartialEvent.partial) {
			try {
				await possiblyPartialEvent.fetch();
			} catch (error) {
				console.error('Something went wrong when fetching the scheduled event:', error);
			}
		}

		const scheduledEvent = possiblyPartialEvent as GuildScheduledEvent<GuildScheduledEventStatus>;

		if (scheduledEvent.isCanceled()) {
			await prisma.week.deleteMany({
				where: {
					eventId: scheduledEvent.id,
				},
			});
			return;
		}

		await prisma.week.updateMany({
			where: {
				eventId: scheduledEvent.id,
			},
			data: {
				start: scheduledEvent.scheduledStartAt ?? undefined,
				end: scheduledEvent.scheduledEndAt ?? undefined,
			},
		});
	},
} satisfies Event<Events.GuildScheduledEventUpdate>;
