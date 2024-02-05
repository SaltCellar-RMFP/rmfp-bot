import type { ChatInputCommandInteraction } from 'discord.js';
import type { SubCommand } from './index.js';

export default {
	subCommandOption(subCommand) {
		return subCommand;
	},
	name: 'leaderboard',
	execute(interaction) {},
} satisfies SubCommand;
