import {Request, RequestHandler, Response} from 'express';

export const NotFound: RequestHandler = async (req: Request, res: Response): Promise<Response> => {
	return res.status(404).send();
};

export const HealthCheck: RequestHandler = async (req: Request, res: Response): Promise<Response> => {
	return res.status(200).send({status: 'ok'});
};
