import type { PrismaClient, Week } from '@prisma/client';
import { prisma } from './prisma.js';

export const getLatestWeek = async (prismaClient?: PrismaClient): Promise<Week | null> => {
	const now = new Date();
	const prismaConn = prisma ?? prismaClient;
	const weeks = (await prismaConn.week.findMany({
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
