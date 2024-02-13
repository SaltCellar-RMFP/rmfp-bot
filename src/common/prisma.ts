import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
	model: {
		week: {
			async current() {
				const now = new Date();
				return prisma.week.findFirst({
					where: {
						end: {
							gte: now,
						},
					},
					include: {
						entries: true,
					},
				});
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
