import type { Temporal } from '@js-temporal/polyfill';
import type { Week } from '@prisma/client';

export const generateText = (week: Week, deadline: Temporal.ZonedDateTime, includeHeader = false): string => {
	const content: string[] = [];
	if (includeHeader) {
		content.push(`# RMFP Week ${week.number}`);
	}

	content.push(
		`**Theme**: ${week.theme}`,
		`## **Rules**:`,
		`- 1 point for submission`,
		`- 3 points for first-time participants`,
		`- 2 points for highest :muah: count`,
		`- Entries must be submitted by ${deadline.toLocaleString()}`,
	);
	return content.join('\n');
};
