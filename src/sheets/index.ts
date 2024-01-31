import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { authenticate } from '@google-cloud/local-auth';
import type { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 */
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content.toString());
		return google.auth.fromJSON(credentials) as OAuth2Client;
	} catch {
		return null;
	}
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 */
async function saveCredentials(client: OAuth2Client) {
	const content = await fs.readFile(CREDENTIALS_PATH);
	const keys = JSON.parse(content.toString());
	const key = keys.installed || keys.web;
	const payload = JSON.stringify({
		type: 'authorized_user',
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	});
	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize(): Promise<OAuth2Client> {
	const client = await loadSavedCredentialsIfExist();
	if (client) {
		return client;
	}

	const oauthClient = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	});
	if (oauthClient.credentials) {
		await saveCredentials(oauthClient);
	}

	return oauthClient;
}
