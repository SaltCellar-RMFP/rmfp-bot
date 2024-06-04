import { Temporal } from '@js-temporal/polyfill';
import type { Entry, Season, Week } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { isRMFPOwner } from '../../common/isRMFPOwner.js';
import { prisma } from '../../common/prisma.js';
import type { SubCommand } from './index.js';

type HistoricalEntry = {
	['First Time Bonus']: number;
	['Message ID']: string;
	['Message URL']: string;
	Reacts: number;
	Season: number;
	Theme: string;
	['User ID']: string;
	Week: number;
	['Winner Bonus']: number;
};

const typifyRow = (row: {
	['First Time Bonus']: string;
	['Message ID']: string;
	['Message URL']: string;
	Name: string;
	Reacts: string;
	Season: string;
	Theme: string;
	['User ID']: string;
	Week: string;
	['Winner Bonus']: string;
}): HistoricalEntry => {
	return {
		'First Time Bonus': Number.parseInt(row['First Time Bonus'], 10),
		Season: Number.parseInt(row.Season, 10),
		Week: Number.parseInt(row.Week, 10),
		'Winner Bonus': Number.parseInt(row['Winner Bonus'], 10),
		Reacts: Number.parseInt(row.Reacts, 10),
		'Message ID': row['Message ID'],
		'Message URL': row['Message URL'],
		'User ID': row['User ID'],
		Theme: row.Theme,
	};
};

export default {
	subCommandOption: (subCommand) =>
		subCommand
			.setName('upload_history')
			.setDescription('Uploads historical RMFP data.')
			.addAttachmentOption((option) =>
				option
					.setName('history_csv')
					.setDescription('A CSV file containing the historical data for RMFP.')
					.setRequired(true),
			),
	name: 'upload_history',
	async execute(interaction) {
		if (!isRMFPOwner(interaction.guild, interaction.member)) {
			await interaction.reply({
				content: 'Only the owner of RMFP may upload historical data.',
				ephemeral: true,
			});
			return;
		}

		const attachment = interaction.options.getAttachment('history_csv', true);
		const response = await fetch(attachment.url);
		if (!response.ok) {
			await interaction.reply({
				content: 'There was an error retrieving the file you attached.',
				ephemeral: true,
			});
			return;
		}

		const text = await response.text();

		const rows: any[] = parse(text, {
			columns: true,
			skip_empty_lines: true,
		});

		const records: HistoricalEntry[] = rows.map(typifyRow);
		const weekCache: Map<`${number}-${number}`, Week> = new Map();
		const seasonCache: Map<number, Season & { weeks: Week[] }> = new Map();

		await interaction.deferReply({ ephemeral: true });
		// Populate caches
		for (const record of records) {
			if (!seasonCache.has(record.Season)) {
				const season =
					(await prisma.season.findFirst({
						where: {
							number: record.Season,
						},
						include: {
							weeks: true,
						},
					})) ??
					(await prisma.season.create({
						data: {
							number: record.Season,
							completed: true,
						},
						include: {
							weeks: true,
						},
					}));
				seasonCache.set(season.number, season);
			}

			if (!weekCache.has(`${record.Season}-${record.Week}`)) {
				const week =
					(await prisma.week.findFirst({
						where: {
							seasonNumber: record.Season,
							number: record.Week,
						},
					})) ??
					(await prisma.week.create({
						data: {
							number: record.Week,
							seasonNumber: record.Season,
							scheduledStart: new Date(),
							scheduledEnd: new Date(),
							ended: true,
							theme: record.Theme,
						},
					}));
				weekCache.set(`${record.Season}-${record.Week}`, week);
			}
		}

		for (const record of records) {
			const entry: Entry = {
				userId: record['User ID'],
				messageId: record['Message ID'],
				messageUrl: record['Message URL'],
				reacts: record.Reacts,
				winnerBonus: record['Winner Bonus'],
				firstTimeBonus: record['First Time Bonus'],
				weekId: weekCache.get(`${record.Season}-${record.Week}`)!.id,
			};
			await prisma.entry.upsert({
				where: {
					userId_weekId: {
						userId: entry.userId,
						weekId: entry.weekId,
					},
				},
				update: entry,
				create: entry,
			});
		}

		await interaction.editReply({
			content: 'done!',
		});
	},
} satisfies SubCommand;
