import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import HealthIDsService from '../services/HealthIDsService';
import {eventPoll, WHISEvent} from '../services/EventBus';
import {log} from '../util/Log';

const EventPoll: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await eventPoll(Object.values(WHISEvent));
		return res.status(200).json(result);
	} catch (err) {
		log.error(err.toString());
		next(err);
	}
};

export default {
	EventPoll
};
