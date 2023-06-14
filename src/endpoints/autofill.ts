import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import {TaxonomyService} from '../services/taxonomy_search';
import {log} from '../util/log';
import {SearchService} from "../services/search/search";

const TaxonomyAutofill: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	const taxonomyService = new TaxonomyService();

	const query = req.params['q'];

	log.info(`query: ${query}`);

	return res.status(200).json(await taxonomyService.searchSpecies(query));
};

const ContactListAutofill: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	const searchService = new SearchService();

	const query = req.params['q'];

	return res.status(200).json(await searchService.searchContactListPerson(query));
};

export default {
	TaxonomyAutofill,
	ContactListAutofill
};
