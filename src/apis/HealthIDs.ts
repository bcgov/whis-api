import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import HealthIDsService from '../services/HealthIDsService';

const TestLock: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	const pool = req.database.pool;
	const queryResult = await HealthIDsService.testLock(pool, req.whisContext.email);
	return res.status(200).json(queryResult);
};

const AcquireLock: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		if (await HealthIDsService.acquireLock(req.database, req.whisContext.email)) {
			return res.status(200).json({status: true, message: 'lock acquired'});
		}
		return res.status(500).json({status: false, message: 'lock NOT acquired'});
	} catch (err) {
		next(err);
	}
};

const RenewLock: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		if (await HealthIDsService.renewLock(req.database, req.whisContext.email)) {
			return res.status(200).json({status: true, message: 'lock renewed'});
		}
		return res.status(500).json({status: false, message: 'lock NOT renewed'});
	} catch (err) {
		next(err);
	}
};

const ReleaseLock: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		if (await HealthIDsService.releaseLock(req.database, req.whisContext.email)) {
			return res.status(200).json({status: true, message: 'lock released'});
		}
		return res.status(500).json({status: false, message: 'lock NOT released'});
	} catch (err) {
		next(err);
	}
};

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await HealthIDsService.listIDsByYear(req.database);

		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

const Generate: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		await HealthIDsService.generateIDs(req.database, req.whisContext.email, req.body);

		return res.status(201).json({status: 'created'});
	} catch (err) {
		next(err);
	}
};

export default {
	List,
	Generate,
	TestLock,
	AcquireLock,
	RenewLock,
	ReleaseLock
};
