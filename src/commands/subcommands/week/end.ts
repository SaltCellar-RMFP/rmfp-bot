import process from 'node:process';
import type { Week } from '@prisma/client';
import type { Client } from 'discord.js';
import { isRMFPOwner } from '../../../common/isRMFPOwner.js';
import { prisma } from '../../../common/prisma.js';
import type { SubCommand } from '../index.js';

const closeRMFPWeek = async (week: Week, client: Client) => {
	const guild = await client.guilds.fetch(process.env.GUILD_ID!);
	const rmfpOwnerRole = guild.roles.cache.get(process.env.RMFP_OWNER_ROLE_ID!)!;
	if (rmfpOwnerRole === null) {
		console.error(`[Close RMFP Week] No RMFP owner role was detected!`);
		return;
	}

	const rmfpOwners = rmfpOwnerRole.members.values();

	console.log(`[Close RMFP Week] RMFP Owners found: ${rmfpOwnerRole.members.size}`);

	const winners = await prisma.week.winners(week.number);
	const content = [
		`The winner(s) of RMFP S${week.seasonNumber}W${week.number} are:`,
		...winners.map((winner, idx) => `${idx + 1}. <@${winner.userId}>'s [message](${winner.messageUrl})`),
	].join('\n');

	for (const owner of rmfpOwners) {
		console.log(`Dispatching announcement message to: ${owner.user.username}`);
		await owner.send(content);
	}

	console.log('[Close RMFP Week] Marking week as ended...');
	await prisma.week.update({
		where: {
			id: week.id,
		},
		data: {
			ended: true,
		},
	});
	console.log('[Close RMFP Week] Week has been ended.');
};

/**
 * Starts a new RMFP week with the provided theme. Informs the user that they must end an ongoing week, if there is one.
 */
export default {
	subCommandOption: (subCommand) => subCommand.setName('end').setDescription('Ends the active week of RMFP.'),
	name: 'end',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may end the week.',
				ephemeral: true,
			});
			return;
		}

		const currentSeason = await prisma.season.current();

		if (currentSeason === null) {
			await interaction.reply({
				content:
					"There's no RMFP season ongoing. You need to start a season (`/rmfp start season`) before running this command.",
				ephemeral: true,
			});
			return;
		}

		const currentWeek = await prisma.week.current();
		if (currentWeek === null) {
			await interaction.reply({
				content: "There's no RMFP week ongoing. This command will do nothing.",
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({ content: 'Ending the current week!', ephemeral: true });
		await closeRMFPWeek(currentWeek, interaction.client);
	},
} satisfies SubCommand;
