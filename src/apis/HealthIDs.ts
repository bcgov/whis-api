import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import HealthIDsService from '../services/HealthIDsService';

const TestLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

const AcquireLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

const ReleaseLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

const List: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	const pool = req.database.pool;

	const queryResult = await HealthIDsService.listIDsByYear(pool);

	return res.status(200).send(queryResult);
};

export default {
	List,
	TestLock,
	AcquireLock,
	ReleaseLock
};
