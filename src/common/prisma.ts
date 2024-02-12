import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
	model: {
		week: {
			async current() {
				const now = new Date();
				return prisma.week.findFirst({
					where: {
						start: {
							lte: now,
						},
						end: {
							gte: now,
						},
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
				});
			},
		},
	},
});
