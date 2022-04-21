import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import CodeTablesService from '../services/CodeTablesService';

const List: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	const pool = req.database.pool;

	const queryResult = await CodeTablesService.listCodeTables(pool);
	return res.status(200).send(queryResult);
};

const Get: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	const pool = req.database.pool;

	const queryResult = await CodeTablesService.getCodeTable(pool, '');
	return res.status(200).send(queryResult);
};

export default {
	Get,
	List
};
