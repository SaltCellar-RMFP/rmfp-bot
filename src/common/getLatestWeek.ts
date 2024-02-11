import type { Week } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const getLatestWeek = async (prismaClient?: PrismaClient): Promise<Week | null> => {
	const prisma = prismaClient ?? new PrismaClient();
	const now = new Date();
	const weeks = (await prisma.week.findMany({
		where: {
			end: {
				gte: now,
			},
			start: {
				lte: now,
			},
		},
		orderBy: {
			number: 'desc',
		},
		take: 1,
	})) as [] | [Week];

	if (weeks.length === 0) {
		console.error('Cannot submit an RMFP entry when there are no active weeks to submit to!');
		return null;
	}

	return weeks[0];
};
