import type { Message } from 'discord.js';
import { Events } from 'discord.js';
import process from 'node:process';
import { RMFPSheetController } from '../sheets/RMFPSheetController.js';
import { authorize } from '../sheets/index.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message) {
		if (process.env.APPLICATION_ID === undefined) {
			console.error('The APPLICATION_ID environment variable was not set.');
			return;
		}

		if (process.env.CHANNEL_ID === undefined) {
			console.error('The CHANNEL_ID environment variable was not set.');
			return;
		}

		if (!message.mentions.has(message.client.application.id)) {
			return;
		}

		if (message.channelId !== process.env.CHANNEL_ID) {
			console.log('mismatch channel');
			return;
		}

		const sheetsClient = await authorize();
		const rmfp = new RMFPSheetController(sheetsClient, process.env.SPREADSHEET_ID!);

		const { author } = message;
		if (!(await rmfp.contestantHasEnteredSeason(author.username))) {
			await rmfp.enterContestant(author.username);
			await rmfp.setFirstTimeBonus(author.username);
		}

		const latestWeek = await rmfp.latestWeek();
		if (!(await rmfp.contestantHasEnteredWeek(author.username, latestWeek))) {
			await rmfp.updateContestantPointsForWeek(author.username, latestWeek, 1, message.url);
		}
	},
} satisfies Event<Events.MessageCreate>;
