import process from 'node:process';
import type { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { RMFPController } from '../sheets/RMFPSheetController.js';
import { authorize } from '../sheets/index.js';

export const updateRMFPScore = async (reaction: MessageReaction | PartialMessageReaction, user: PartialUser | User) => {
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

	if (user.partial) {
		try {
			await user.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the user:', error);
			return;
		}
	}

	const sheetsClient = await authorize();
	const rmfp = new RMFPController(sheetsClient, process.env.SPREADSHEET_ID!);
	const latestWeek = await rmfp.latestWeek();
	if (!(await rmfp.isRMFPEntryForWeek(reaction.message.url, latestWeek))) {
		console.log("Got a reaction on a message that wasn't an entry for the week.");
		return;
	}

	if (reaction.message.author === null) {
		console.error(`Can't update RMFP score for entry ${reaction.message.url} because author is null.`);
		return;
	}

	if (reaction.count === null) {
		console.error(`Can't update RMFP score for entry ${reaction.message.url} because the reaction count is null.`);
		return;
	}

	return rmfp.updateContestantPointsForWeek(
		reaction.message.author!.username,
		latestWeek,
		reaction.count,
		reaction.message.url,
	);
};
