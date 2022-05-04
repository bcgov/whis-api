import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import YearsService from '../services/YearsService';

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await YearsService.listYears(req.database);
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

export default {
	List
};
