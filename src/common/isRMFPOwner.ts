import process from 'node:process';
import { type APIInteractionGuildMember, type Guild, type GuildMember } from 'discord.js';

export const isRMFPOwner = (guild: Guild | null, member: APIInteractionGuildMember | GuildMember | null): boolean => {
	if (process.env.RMFP_OWNER_ROLE_ID === undefined) {
		console.error(`Error: no RMFP_OWNER_ROLE_ID was provided.`);
		return false;
	}

	if (member === null) {
		console.warn(`Can't verify if null is the RMFP Owner`);
		return false;
	}

	const rmfpOwnerRole = guild?.roles.cache.get(process.env.RMFP_OWNER_ROLE_ID);

	if (rmfpOwnerRole === undefined) {
		console.error(`Guild ${guild?.name} does not have a role with ID ${process.env.RMFP_OWNER_ROLE_ID}`);
		return false;
	}

	try {
		return (member as GuildMember).roles.cache.get(rmfpOwnerRole.id) !== undefined;
	} catch {
		return (member as APIInteractionGuildMember).roles.includes(rmfpOwnerRole.id) ?? false;
	}
};
