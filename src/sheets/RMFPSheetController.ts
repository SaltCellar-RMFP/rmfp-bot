import type { OAuth2Client } from 'google-auth-library';
import type { sheets_v4 } from 'googleapis';
import { google } from 'googleapis';

export class RMFPController {
	private readonly sheets: sheets_v4.Sheets;

	private static readonly CONTESTANT_COL = 1;

	private static readonly CONTESTANT_START_ROW = 4;

	private static readonly CONTESTANT_END_ROW = 9_999;

	private static readonly FIRST_TIME_BONUS_COL = 2;

	private static readonly FIRST_TIME_BONUS_POINTS = 3;

	private static readonly WEEKS_ROW = 2;

	private static readonly WEEKS_START_COL = 4;

	private static readonly WEEKS_END_COL = 9_999;

	private static readonly THEME_ROW = 3;

	public constructor(
		client: OAuth2Client,
		private readonly spreadsheetId: string,
	) {
		this.sheets = google.sheets({ version: 'v4', auth: client });
	}

	public async getContestants() {
		const startCell = `R${RMFPController.CONTESTANT_START_ROW}C${RMFPController.CONTESTANT_COL}`;
		const endCell = `R${RMFPController.CONTESTANT_END_ROW}C${RMFPController.CONTESTANT_COL}`;
		const usernameResponse = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!${startCell}:${endCell}`,
		});

		if (usernameResponse.data.values === null || usernameResponse.data.values === undefined) {
			return [];
		}

		return usernameResponse.data.values[0] as string[];
	}

	public rowOfContestant = async (username: string) => {
		const contestants = await this.getContestants();
		const contestantIndex = contestants.indexOf(username);
		if (contestantIndex === -1) {
			return -1;
		}

		return contestantIndex + RMFPController.CONTESTANT_START_ROW;
	};

	public contestantHasEnteredSeason = async (username: string) => (await this.rowOfContestant(username)) !== -1;

	public async contestantHasEnteredWeek(username: string, weekNumber: number) {
		const weekColumn = await this.columnOfWeek(weekNumber);
		const contestantRow = await this.rowOfContestant(username);

		if (contestantRow === -1) {
			return false;
		}

		const cellRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${contestantRow}C${weekColumn}`,
		});

		if (cellRes.data.values === null || cellRes.data.values === undefined) {
			return false;
		}

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
		const newUserRow = contestants.length + RMFPController.CONTESTANT_START_ROW;
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${newUserRow}C${RMFPController.CONTESTANT_COL}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[username]],
			},
		});
	}

	public async getWeeks(): Promise<number[]> {
		const weeksRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPController.WEEKS_ROW}C${RMFPController.WEEKS_START_COL}:R${RMFPController.WEEKS_ROW}C${RMFPController.WEEKS_END_COL}`,
			majorDimension: 'ROWS',
		});
		if (weeksRes.data.values === undefined || weeksRes.data.values === null) {
			return [];
		}

		return weeksRes.data.values[0].map((x: string) => Number.parseInt(x, 10));
	}

	public async latestWeek(): Promise<number> {
		const weeks = await this.getWeeks();
		if (weeks.length === 0) {
			return 0;
		}

		return weeks[weeks.length - 1];
	}

	public async startNewWeek(theme: string): Promise<number> {
		const latestWeekNumber = await this.latestWeek();
		const latestWeekColumn = await this.columnOfWeek(latestWeekNumber);
		const newWeekColumn = latestWeekColumn + 1;
		const newWeekValue = latestWeekNumber + 1;
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPController.WEEKS_ROW}C${newWeekColumn}:R${RMFPController.THEME_ROW}C${newWeekColumn}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[newWeekValue], [theme]],
			},
		});
		return newWeekValue;
	}

	public async setThemeForWeek(weekNumber: number, theme: string): Promise<void> {
		const weekColumn = await this.columnOfWeek(weekNumber);
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPController.THEME_ROW}C${weekColumn}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[theme]],
			},
		});
	}

	public async getThemeForWeek(weekNumber: number): Promise<string | null> {
		const weekColumn = await this.columnOfWeek(weekNumber);
		if (weekColumn === -1) {
			return null;
		}

		const themeRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPController.THEME_ROW}C${weekColumn}`,
		});

		if (themeRes.data.values === undefined || themeRes.data.values === null) {
			return null;
		}

		return themeRes.data.values![0][0];
	}

	public async columnOfWeek(weekNumber: number): Promise<number> {
		const weeks = await this.getWeeks();
		if (weeks.length === 0) {
			return -1;
		}

		return weeks.indexOf(weekNumber) + RMFPController.WEEKS_START_COL;
	}

	public async updateContestantPointsForWeek(username: string, weekNumber: number, points: number, messageUrl: string) {
		if (!(await this.contestantHasEnteredSeason(username))) {
			await this.enterContestant(username);
		}

		const contestantRow = await this.rowOfContestant(username);
		const weekColumn = await this.columnOfWeek(weekNumber);
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${contestantRow}C${weekColumn}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[`=HYPERLINK("${messageUrl}", ${points})`]],
			},
		});
	}

	public async setFirstTimeBonus(username: string) {
		const contestantRow = await this.rowOfContestant(username);
		if (contestantRow === -1) {
			console.error(`Attempted to set a first time bonus for ${username}, but they weren't a contestant.`);
		}

		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${contestantRow}C${RMFPController.FIRST_TIME_BONUS_COL}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[RMFPController.FIRST_TIME_BONUS_POINTS]],
			},
		});
	}
}
