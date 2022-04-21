import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';

const TestLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

const AcquireLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

const ReleaseLock: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return null;
};

export default {
	TestLock,
	AcquireLock,
	ReleaseLock
};
