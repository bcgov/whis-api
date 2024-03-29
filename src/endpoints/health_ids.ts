import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import HealthIDsService from '../services/health_ids';
import {SearchService} from '../services/search/search';

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

const Search: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	const searchService = new SearchService();

	try {
		const searchResult = await searchService.wildlifeIDSearch(req.body);
		return res.status(200).json(searchResult);
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

const Detail: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await HealthIDsService.getId(req.database, req.params['id']);

		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

const Generate: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await HealthIDsService.generateIDs(req.database, req.whisContext.email, {
			...req.body,
			region: !isNaN(parseInt(req.body.region)) ? parseInt(req.body.region) : null,
			requester: !isNaN(parseInt(req.body.requester)) ? parseInt(req.body.requester) : null
		});

		return res.status(201).json({status: 'created', result});
	} catch (err) {
		next(err);
	}
};

const PatchDetails: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await HealthIDsService.patchId(req.database, req.params['id'], {
			mode: 'DETAIL',
			data: {
				...req.body
			},
			updater: req.whisContext.email
		});

		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

const PatchEvents: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await HealthIDsService.patchId(req.database, req.params['id'], {
			mode: 'EVENTS',
			data: {
				...req.body
			},
			updater: req.whisContext.email
		});

		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

const PatchPurpose: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await HealthIDsService.patchId(req.database, req.params['id'], {
			mode: 'PURPOSE',
			data: {
				...req.body
			},
			updater: req.whisContext.email
		});

		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};

export default {
	List,
	Detail,
	Search,
	Generate,
	PatchDetails,
	PatchEvents,
	PatchPurpose,
	TestLock,
	AcquireLock,
	RenewLock,
	ReleaseLock
};
