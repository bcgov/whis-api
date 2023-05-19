import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import ReferenceDataService from '../services/ReferenceDataService';

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await ReferenceDataService.getReferenceData(req.database);
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

export default {
	List
};
