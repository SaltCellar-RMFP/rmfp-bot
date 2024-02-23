import type { CronJobParams } from 'cron';
import type { StructurePredicate } from '../util/loaders.ts';

export type Job = Pick<CronJobParams, 'cronTime' | 'onTick' | 'start' | 'timeZone'>;
// Defines the predicate to check if an object is a valid Event type.
export const predicate: StructurePredicate<Job> = (structure): structure is Job =>
	Boolean(structure) &&
	typeof structure === 'object' &&
	'cronTime' in structure! &&
	'onTick' in structure! &&
	'start' in structure! &&
	'timeZone' in structure! &&
	typeof structure.cronTime === 'string' &&
	typeof structure.onTick === 'function' &&
	typeof structure.start === 'boolean' &&
	typeof structure.timeZone === 'string';
