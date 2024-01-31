import { Events } from 'discord.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: true,
	async execute(message) {
		// PART 1: Identify latest row of Google Sheet
		// PART 2: Calculate week number from that
		// PART 3:
		//	If user has already made an entry for the week, ask them if they'd like to replace their entry
		//		This will reset their points for the week.
		//	If the user has participated before, nothing to do right now.
		// 	If the user hasn't participated before, add a column to the sheet.
		if (!message.mentions.has(message.client.user.id)) {
			return;
		}

		await message.react('👀');
	},
} satisfies Event<Events.MessageCreate>;
