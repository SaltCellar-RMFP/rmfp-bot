import type { OAuth2Client } from 'google-auth-library';
import type { sheets_v4 } from 'googleapis';
import { google } from 'googleapis';

export class RMFPSheetController {
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

	private static readonly SUM_COL = 17;

	private static readonly HYPERLINK_REGEX = /=HYPERLINK\("(?<href>[^"]+)"/;

	public constructor(
		client: OAuth2Client,
		private readonly spreadsheetId: string,
	) {
		this.sheets = google.sheets({ version: 'v4', auth: client });
	}

	public async getContestants() {
		const startCell = `R${RMFPSheetController.CONTESTANT_START_ROW}C${RMFPSheetController.CONTESTANT_COL}`;
		const endCell = `R${RMFPSheetController.CONTESTANT_END_ROW}C${RMFPSheetController.CONTESTANT_COL}`;
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

		return contestantIndex + RMFPSheetController.CONTESTANT_START_ROW;
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
		const newUserRow = contestants.length + RMFPSheetController.CONTESTANT_START_ROW;
		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${newUserRow}C${RMFPSheetController.CONTESTANT_COL}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[username]],
			},
		});
	}

	public async getWeeks(): Promise<number[]> {
		const weeksRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPSheetController.WEEKS_ROW}C${RMFPSheetController.WEEKS_START_COL}:R${RMFPSheetController.WEEKS_ROW}C${RMFPSheetController.WEEKS_END_COL}`,
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
			range: `Season 3!R${RMFPSheetController.WEEKS_ROW}C${newWeekColumn}:R${RMFPSheetController.THEME_ROW}C${newWeekColumn}`,
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
			range: `Season 3!R${RMFPSheetController.THEME_ROW}C${weekColumn}`,
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
			range: `Season 3!R${RMFPSheetController.THEME_ROW}C${weekColumn}`,
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

		return weeks.indexOf(weekNumber) + RMFPSheetController.WEEKS_START_COL;
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
			return;
		}

		await this.sheets.spreadsheets.values.update({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${contestantRow}C${RMFPSheetController.FIRST_TIME_BONUS_COL}`,
			valueInputOption: 'USER_ENTERED',
			requestBody: {
				values: [[RMFPSheetController.FIRST_TIME_BONUS_POINTS]],
			},
		});
	}

	public async isRMFPEntryForWeek(messageUrl: string, weekNumber: number): Promise<boolean> {
		const weekColumn = await this.columnOfWeek(weekNumber);
		if (weekColumn === -1) {
			console.error(
				`Attempted to determine if message ${messageUrl} was an entry for week ${weekNumber}, but no matching week was found.`,
			);
			return false;
		}

		const weekEntriesRes = await this.sheets.spreadsheets.values.get({
			spreadsheetId: this.spreadsheetId,
			range: `Season 3!R${RMFPSheetController.CONTESTANT_START_ROW}C${weekColumn}:R${RMFPSheetController.CONTESTANT_END_ROW}C${weekColumn}`,
			valueRenderOption: 'FORMULA',
		});

		return (
			weekEntriesRes.data.values?.findIndex((row: [string]) => {
				const matches = RMFPSheetController.HYPERLINK_REGEX.exec(row[0]);
				if (matches === null) {
					return false;
				}

				// matches[0] is the entire matched string, which isn't helpful here.
				const hyperlink = matches[1];

				return hyperlink === messageUrl;
			}) !== -1
		);
	}

	public async calculateSeasonPoints(): Promise<{ total: number; username: string }[]> {
		const usernameRange = `Season 3!R${RMFPSheetController.CONTESTANT_START_ROW}C${RMFPSheetController.CONTESTANT_COL}:R${RMFPSheetController.CONTESTANT_END_ROW}C${RMFPSheetController.CONTESTANT_COL}`;
		const sumRange = `Season 3!R${RMFPSheetController.CONTESTANT_START_ROW}C${RMFPSheetController.SUM_COL}:R${RMFPSheetController.CONTESTANT_END_ROW}C${RMFPSheetController.SUM_COL}`;
		const response = await this.sheets.spreadsheets.values.batchGet({
			spreadsheetId: this.spreadsheetId,
			ranges: [usernameRange, sumRange],
		});

		const returnValues: { total: number; username: string }[] = [];

		if (!response.data.valueRanges) {
			console.error(`Error fetching value ranges while calculating season points.`);
			return [];
		}

		if (response.data.valueRanges.length !== 2) {
			console.error(`Only ${response.data.valueRanges.length} ranges were returned, not 2.`);
			return [];
		}

		const { values: usernames } = response.data.valueRanges![0]!;
		const { values: totals } = response.data.valueRanges![1]!;
		for (const [idx, [username]] of usernames!.entries()) {
			returnValues.push({ username, total: Number.parseInt(totals![idx][0] as string, 10) });
		}

		return returnValues;
	}
}
