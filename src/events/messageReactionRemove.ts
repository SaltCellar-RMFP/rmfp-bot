import { Events } from 'discord.js';
import { updateRMFPScore } from './updateRMFPScore.js';
import type { Event } from './index.js';

export default {
	name: Events.MessageReactionRemove,
	once: false,
	execute: updateRMFPScore,
} satisfies Event<Events.MessageReactionRemove>;
