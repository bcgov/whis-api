import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import CodeTablesService from '../services/CodeTablesService';

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await CodeTablesService.listCodeTables(req.database);
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

const Get: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await CodeTablesService.getCodeTable(req.database, '');
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

export default {
	Get,
	List
};
