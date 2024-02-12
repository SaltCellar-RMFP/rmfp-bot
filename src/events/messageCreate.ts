import type { Message } from 'discord.js';
import { Events } from 'discord.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {},
} satisfies Event<Events.MessageCreate>;
