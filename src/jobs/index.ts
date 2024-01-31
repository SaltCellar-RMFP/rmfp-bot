import type { StructurePredicate } from '../util/loaders.ts';

/**
 * Defines the structure of a job.
 */
export type JobDefinition = {
	/**
	 * The function to execute when the cron job runs.
	 *
	 * @param parameters - The parameters of the event
	 */
	execute(): Promise<void> | void;
	/**
	 * Whether or not the job should only be executed once
	 *
	 * @defaultValue false
	 */
	once?: boolean;
	/**
	 * A cron scheduling string indicating how often this job should be run.
	 */
	schedule: string;
};

// Defines the predicate to check if an object is a valid Event type.
export const predicate: StructurePredicate<JobDefinition> = (structure): structure is JobDefinition =>
	Boolean(structure) &&
	typeof structure === 'object' &&
	'execute' in structure! &&
	'schedule' in structure &&
	typeof structure.schedule === 'string' &&
	typeof structure.execute === 'function';
