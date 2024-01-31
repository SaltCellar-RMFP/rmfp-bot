import { Events } from 'discord.js';
import { RMFPController } from '../sheets/RMFPController.js';
import { authorize } from '../sheets/index.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: true,
	async execute(message) {
		if (!message.mentions.has(message.client.user.id)) {
			return;
		}

		const googleClient = await authorize();
		const rmfp = new RMFPController(googleClient);
		const latestWeek = await rmfp.latestWeek();
		// PART 3:
		//	If user has already made an entry for the week, ask them if they'd like to replace their entry
		//		This will reset their points for the week.
		if (await rmfp.contestantHasEnteredWeek(message.author.username!, latestWeek)) {
			await message.reply(
				"You've already entered RMFP for this week. Do you want to replace your current entry with a new one?",
			);

			// How do we deal with this?
			return;
		}

		await rmfp.updateContestantPointsForWeek(message.author.username!, latestWeek, 0);

		await message.react('👀');
	},
} satisfies Event<Events.MessageCreate>;
