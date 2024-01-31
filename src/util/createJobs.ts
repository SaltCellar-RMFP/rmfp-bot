import { CronJob } from 'cron';
import type { JobDefinition } from '../jobs/index.js';

export function createJobs(jobDefinitions: JobDefinition[]): CronJob[] {
	return jobDefinitions.map((job) => {
		console.log(job);
		return new CronJob(job.schedule, job.execute, null, true, 'America/Chicago');
	});
}
