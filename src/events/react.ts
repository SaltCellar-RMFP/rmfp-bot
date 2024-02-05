import process from 'node:process';
import { Events } from 'discord.js';
import { RMFPController } from '../sheets/RMFPSheetController.js';
import { authorize } from '../sheets/index.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageReactionAdd,
	once: false,
	async execute(reaction, user) {
		if (reaction.emoji.name !== '❤️') {
			return;
		}

		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Something went wrong when fetching the message:', error);
				return;
			}
		}

		// Edge cases
		//  Q. What happens if there's a reaction added to a message authored by one of this week's contestants, but that message is not actually an RMFP post?
		//      A. need to validate message ID equality (maybe use hyperlink in points box?)
		//  Q. What happens if I react to an OLD RMFP post? (i.e. from a closed week?)
		//      A. Should we store start/end times in sheet?
		//  Q. What happens if a reaction is added to a message that isn't related to RMFP?

		const sheetsClient = await authorize();
		const rmfp = new RMFPController(sheetsClient, process.env.SPREADSHEET_ID!);
	},
} satisfies Event<Events.MessageReactionAdd>;
