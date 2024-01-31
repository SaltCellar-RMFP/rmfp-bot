import type { StructurePredicate } from '../util/loaders.ts';

/**
 * Defines the structure of a job.
 */
export type Job = {
	/**
	 * The function to execute when the event is emitted.
	 *
	 * @param parameters - The parameters of the event
	 */
	execute(): Promise<void> | void;
	/**
	 * The name of the event to listen to
	 */
	name: string;
	/**
	 * Whether or not the job should only be executed once
	 *
	 * @defaultValue false
	 */
	once?: boolean;
};

// Defines the predicate to check if an object is a valid Event type.
export const predicate: StructurePredicate<Job> = (structure): structure is Job =>
	Boolean(structure) &&
	typeof structure === 'object' &&
	'name' in structure! &&
	'execute' in structure &&
	typeof structure.name === 'string' &&
	typeof structure.execute === 'function';
