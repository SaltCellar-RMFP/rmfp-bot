import type { Season } from '@prisma/client';
import { prisma } from './prisma.js';

export const getCurrentSeason = async (): Promise<Season | null> => {
	const seasons = (await prisma.season.findMany({
		where: {
			completed: false,
		},
		orderBy: {
			number: 'desc',
		},
		take: 1,
	})) as [] | [Season];

	if (seasons.length === 0) {
		console.error('Cannot submit an RMFP entry when there are no active weeks to submit to!');
		return null;
	}

	return seasons[0];
};
