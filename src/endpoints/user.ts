import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import UserService from '../services/user';

const Me: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		return res.status(200).send({
			email: req.whisContext.email,
			roles: req.whisContext.roles
		});
	} catch (err) {
		next(err);
	}
};

const GetAccessRequest: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const result = await UserService.getAccessRequest(req.database, req.whisContext.email);
		return res.status(200).json(result);
	} catch (err) {
		next(err);
	}
};
const RequestAccess: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		await UserService.createAccessRequest(req.database, req.whisContext.email);
		return res.status(201).send();
	} catch (err) {
		next(err);
	}
};
export default {
	Me,
	GetAccessRequest,
	RequestAccess
};
