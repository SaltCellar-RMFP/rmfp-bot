import process from 'node:process';
import { RMFPSheetController } from '../../sheets/RMFPSheetController.js';
import { authorize } from '../../sheets/index.js';
import type { SubCommand } from './index.js';

export default {
	subCommandOption: (subCommand) =>
		subCommand.setName('leaderboard').setDescription('Calculates the current standings for this season of RMFP!'),
	name: 'leaderboard',
	async execute(interaction) {
		const sheetsClient = await authorize();
		const rmfp = new RMFPSheetController(sheetsClient, process.env.SPREADSHEET_ID!);
		const results = await rmfp.calculateSeasonPoints();
		results.sort((a, b) => {
			if (a.total !== b.total) {
				return a.total - b.total;
			}

			const aUpper = a.username.toUpperCase();
			const bUpper = b.username.toUpperCase();

			if (aUpper < bUpper) {
				return -1;
			} else if (aUpper > bUpper) {
				return 1;
			}

			return 0;
		});

		results.reverse();
		console.log(results);

		let response = `# RMFP Season 3 Leaderboard\n`;
		for (const [index, { username, total }] of results.entries()) {
			response += `${index + 1}. **${username}**: ${total}\n`;
		}

		await interaction.reply({ content: response, ephemeral: true });
	},
} satisfies SubCommand;
