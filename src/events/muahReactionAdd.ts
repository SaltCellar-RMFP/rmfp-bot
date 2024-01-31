import { Events } from 'discord.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageReactionAdd,
	once: true,
	async execute(reaction) {
		// Part 1: Identify the message that the reaction was placed on
		if (!reaction.message.mentions.has(reaction.client.user.id)) {
		}

		// Part 2: If the reaction isn't a :muah: emoji, no need to keep processing.
		// Part 3: If the message that was reacted to is an entry in this week's RMFP,
		//         increase the number of points that user has for the week by one.
	},
} satisfies Event<Events.MessageReactionAdd>;
