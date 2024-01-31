import {
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from 'discord.js';
import { DateTime } from 'luxon';
import type { Command } from './index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName('rmfp')
		.setDescription('Starts a new week of RMFP!')
		.addStringOption(
			new SlashCommandStringOption().setName('theme').setDescription("What's this week's theme?").setRequired(true),
		)
		.toJSON(),
	async execute(interaction) {
		// PART 1:
		// Create a new row in the Google Sheet
		// Rows: Weeks (start @ A2, values = week number)
		// Columns: Discord usernames
		// Values: Calculated number of points

		// PART 2:
		// Send a formal announcement announcing that RMFP has started
		await interaction.channel?.send(
			`
            # RMFP Week ${0}\n
            ## Theme: ${interaction.options.get('theme', true).value}\n
            `,
		);

		// PART 3:
		// Create an event?
		await interaction.guild?.scheduledEvents.create({
			name: `RMFP Week ${0}`,
			scheduledStartTime: DateTime.now().toJSDate(),
			scheduledEndTime: DateTime.now()
				.startOf('day')
				.set({ weekday: 1, hour: 10, minute: 0, second: 0 })
				.plus({ week: 1 })
				.toJSDate(),
			description: `
                Theme: ${interaction.options.get('theme', true).value}\n
            `,
			entityType: GuildScheduledEventEntityType.External,
			privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
		});
	},
} satisfies Command;
