import {EventEmitter, once} from 'events';
import {log} from '../util/Log';

const LONG_POLL_TIME = 5 * 1000;

const eventBus = new EventEmitter();

eventBus.setMaxListeners(200);

export enum WHISEvent {
	LOCK_BECOMES_AVAILABLE = 'LOCK_BECOMES_AVAILABLE',
	LOCK_BECOMES_UNAVAILABLE = 'LOCK_BECOMES_UNAVAILABLE'
}

export interface DetectedEvent {
	type: WHISEvent;
	payload: any;
}

export async function eventPoll(e: WHISEvent[]): Promise<DetectedEvent[]> {
	const abortController = new AbortController();
	const result = [];

	setTimeout(() => {
		abortController.abort();
	}, LONG_POLL_TIME);

	const promises = e.map(async event => {
		const eventResolution = await once(eventBus, event, {signal: abortController.signal});
		return {
			type: event,
			payload: eventResolution
		};
	});
	const resolutions = await Promise.allSettled(promises);
	for (const eventResolution of resolutions) {
		if (eventResolution.status === 'fulfilled') {
			result.push({
				type: eventResolution.value.type,
				payload: eventResolution.value.payload
			});
		}
	}
	return result;
}

export function dispatchEvent(e: WHISEvent, payload?) {
	process.nextTick(() => {
		eventBus.emit(e, payload);
	});
}
