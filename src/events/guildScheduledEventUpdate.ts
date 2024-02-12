import type { GuildScheduledEvent, GuildScheduledEventStatus } from 'discord.js';
import { Events } from 'discord.js';
import { prisma } from '../common/prisma.js';
import type { Event } from './index.js';

export default {
	name: Events.GuildScheduledEventUpdate,
	once: false,
	async execute(oldEventState, newEventState) {},
} satisfies Event<Events.GuildScheduledEventUpdate>;
