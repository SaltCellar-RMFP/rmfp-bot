import {
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	SlashCommandBuilder,
	SlashCommandStringOption,
	SlashCommandUserOption,
} from 'discord.js';
import { DateTime } from 'luxon';
import { RMFPController } from '../sheets/RMFPController.js';
import { authorize } from '../sheets/index.js';
import type { Command } from './index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Starts a new week of RMFP!')
		.addStringOption(
			new SlashCommandStringOption().setName('theme').setDescription("What's this week's theme?").setRequired(true),
		)
		.addUserOption(
			new SlashCommandUserOption().setName('user').setDescription("Who won last week's RMFP?").setRequired(false),
		)
		.toJSON(),
	async execute(interaction) {
		const client = await authorize();
		const rmfp = new RMFPController(client);
		// PART 1:
		// Create a new row in the Google Sheet
		// Rows: Weeks (start @ A2, values = week number)
		// Columns: Discord usernames

		// PART 2:
		// Send a formal announcement announcing that RMFP has started
		// PART 3:
		// Create an event?
		await interaction.guild?.scheduledEvents.create({
			name: `RMFP: Week ${await rmfp.latestWeek()}`,
			description: `
				**Theme**: gabagool\n 
			`,
			scheduledStartTime: DateTime.now().plus({ minute: 1 }).toJSDate(),
			privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
			entityType: GuildScheduledEventEntityType.External,
			scheduledEndTime: DateTime.now()
				.startOf('day')
				.plus({ week: 1 })
				.set({ hour: 10, minute: 0, second: 0 })
				.toJSDate(),
			entityMetadata: {
				location: '#rmfp',
			},
		});
	},
} satisfies Command;
