import type { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';

/**
 * Defines the structure of a command
 */
export type SubCommand = {
	/**
	 * The function to execute when the command is called
	 *
	 * @param interaction - The interaction of the command
	 */
	execute(interaction: ChatInputCommandInteraction): Promise<void> | void;
	name: string;
	subCommandOption(this: void, subCommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder;
};
