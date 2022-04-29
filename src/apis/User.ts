import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../App';
import UserService from '../services/UserService';

const Me: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	return res.status(200).send({
		email: req.whisContext.email,
		roles: req.whisContext.roles
	});
};

const GetAccessRequest: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	const result = await UserService.getAccessRequest(req.database.pool, req.whisContext.email);
	return res.status(200).json(result);
};
const RequestAccess: RequestHandler = async (req: WHISRequest, res: Response): Promise<Response> => {
	await UserService.createAccessRequest(req.database.pool, req.whisContext.email);
	return res.status(201).send();
};
export default {
	Me,
	GetAccessRequest,
	RequestAccess
};
