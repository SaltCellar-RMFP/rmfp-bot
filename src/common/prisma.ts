import type { Entry } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
	model: {
		week: {
			async current() {
				return prisma.week.findFirst({
					where: {
						ended: false,
					},
					include: {
						entries: true,
					},
				});
			},

			async winners(weekId: number): Promise<Entry[]> {
				const entries = await prisma.entry.findMany({
					where: {
						weekId,
					},
					orderBy: {
						reacts: 'desc',
					},
				});

				if (entries.length === 0) {
					return [];
				}

				const maxPoints = entries[0].reacts;
				return entries.filter((row) => row.reacts === maxPoints);
			},
		},

		season: {
			async current() {
				return prisma.season.findFirst({
					where: {
						completed: false,
					},
					orderBy: {
						number: 'desc',
					},
					include: {
						weeks: true,
					},
				});
			},
		},
	},
});
