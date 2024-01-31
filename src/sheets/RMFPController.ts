import process from 'node:process';
import type { OAuth2Client } from 'google-auth-library';
import type { sheets_v4 } from 'googleapis';
import { google } from 'googleapis';

export class RMFPController {
	private readonly sheets: sheets_v4.Sheets;

	private static readonly WEEKS_START_ROW = 3;

	private static readonly WEEKS_COL = 1;

	private static readonly WEEKS_END_ROW = 99;

	private static readonly CONTESTANT_START_COL = 2;

	private static readonly CONTESTANT_END_COL = 999;

	private static readonly CONTESTANT_ROW = 2;

	public constructor(private readonly client: OAuth2Client) {
		this.sheets = google.sheets({ version: 'v4', auth: client });
	}

	public async getContestants() {
		const startCell = `R${RMFPController.CONTESTANT_ROW}C${RMFPController.CONTESTANT_START_COL}`;
		const endCell = `R${RMFPController.CONTESTANT_ROW}C${RMFPController.CONTESTANT_END_COL}`;
		const usernameResponse = await this.sheets.spreadsheets.values.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: `Season 3!${startCell}:${endCell}`,
		});

		if (usernameResponse.data.values === null || usernameResponse.data.values === undefined) {
			return [];
		}

		return usernameResponse.data.values[0] as string[];
	}

	public columnIndexOfContestant = async (username: string) => {
		const contestants = await this.getContestants();
		const contestantIndex = contestants.indexOf(username);
		if (contestantIndex === -1) {
			return -1;
		}

		return contestantIndex + RMFPController.CONTESTANT_START_COL;
	};

	public contestantHasEnteredSeason = async (username: string) => (await this.columnIndexOfContestant(username)) !== -1;

	public async contestantHasEnteredWeek(username: string, weekNumber: number) {
		const rowIndex = await this.rowIndexOfWeek(weekNumber);
		const colIndex = await this.columnIndexOfContestant(username);

		const cellRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: `Season 3!R${rowIndex}C${colIndex}`,
		});

		const cellValue = cellRes.data.values![0][0];

		return cellValue !== null && cellValue !== undefined;
	}

	public async enterContestant(username: string): Promise<void> {
		if (await this.contestantHasEnteredSeason(username)) {
			console.error(
				`[ERROR] Attempting to add user ${username} to the list of entered players, but they've already been entered.`,
			);
			return;
		}

		const contestants = await this.getContestants();
		const newUserIndex = contestants.length + RMFPController.CONTESTANT_START_COL;
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: `Season 3!R${RMFPController.CONTESTANT_ROW}C${newUserIndex}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[username]],
			},
		});
	}

	public async getWeeks(): Promise<number[]> {
		const weeksRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: `Season 3!R${RMFPController.WEEKS_START_ROW}C${RMFPController.WEEKS_COL}:R${RMFPController.WEEKS_END_ROW}C${RMFPController.WEEKS_COL}`,
			majorDimension: 'COLUMNS',
		});
		return weeksRes.data.values![0].map((x: string) => Number.parseInt(x, 10));
	}

	public async latestWeek(): Promise<number> {
		const weeks = await this.getWeeks();
		return weeks[weeks.length - 1];
	}

	public async rowIndexOfWeek(weekNumber: number): Promise<number> {
		return (await this.getWeeks()).indexOf(weekNumber) + RMFPController.WEEKS_START_ROW;
	}

	public async updateContestantPointsForWeek(username: string, weekNumber: number, points: number) {
		if (!(await this.contestantHasEnteredSeason(username))) {
			await this.enterContestant(username);
		}

		const columnIndex = await this.columnIndexOfContestant(username);
		const rowIndex = await this.rowIndexOfWeek(weekNumber);
		const updatedCell = await this.sheets.spreadsheets.values.update({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: `Season 3!R${rowIndex}C${columnIndex}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[points]],
			},
		});
	}
}
