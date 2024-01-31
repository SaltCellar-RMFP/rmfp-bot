import { Events } from 'discord.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageReactionRemove,
	once: true,
	async execute(reaction) {
		// Part 1: Identify the message that the reaction was removed from
		// Part 2: If the reaction isn't a :muah: emoji, no need to keep processing.
		// Part 3: If the message isn't an RMFP entry, no need to keep processing.
		// Part 4: Remove a point from the user's score.
	},
} satisfies Event<Events.MessageReactionRemove>;
