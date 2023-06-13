import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import ContactListService from '../services/contact_list';

const List: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await ContactListService.getContacts(req.database);
		return res.status(200).json(queryResult);
	} catch (err) {
		next(err);
	}
};

const Add: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	try {
		const queryResult = await ContactListService.addContact(req.database, req.body);
		return res.status(201).json(queryResult);
	} catch (err) {
		next(err);
	}
};

export default {
	List,
	Add
};
