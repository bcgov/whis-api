import {RequestHandler, Response} from 'express';
import {WHISRequest} from '../app';
import {TaxonomyService} from '../services/taxonomy_search';
import {log} from '../util/log';

const TaxonomyAutofill: RequestHandler = async (req: WHISRequest, res: Response, next): Promise<Response> => {
	const taxonomyService = new TaxonomyService();

	const query = req.params['q'];

	log.info(`query: ${query}`);

	return res.status(200).json(await taxonomyService.searchSpecies(query));
};

export default {
	TaxonomyAutofill
};
