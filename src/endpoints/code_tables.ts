import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import Reference_data from '../services/reference_data';

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await Reference_data.getReferenceData(req.database);
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

export default {
	List
};
