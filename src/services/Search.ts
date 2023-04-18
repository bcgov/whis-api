import {Client} from '@elastic/elasticsearch';
import esb from 'elastic-builder';
import _ from 'lodash';

import {log} from '../util/Log';
import {Config} from '../Config';
import HealthIDsService from './HealthIDsService';
import {pool} from '../Server';
import {AggregationsAggregate, SearchResponse} from '@elastic/elasticsearch/lib/api/types';

interface HealthIDIndexedForm {
	id: number;
	year: number;
	wlhID: string;
	creationDate: number; //millis since epoch
	creator: string | null;
	currentStatus: string | null;
	purpose: string | null;
	requesterFirstName: string | null;
	requesterLastName: string | null;
	requesterOrganization: string | null;
	species: string | null;
	lastEventType: string | null;
	lastEventDate: number | null;
	homeRegion: string | null;
}

// this is the form that comes in from the client
interface SearchRequest {
	keywords?: string[];
	minimumId?: string;
	maximumId?: string;
	namedDateRanges?: string[];
	creation?: {
		startDate?: string;
		endDate?: string;
	};
	status?: string;
	purpose?: string;
	requester?: {
		name?: string;
		organization?: string;
	};
	species?: string;
	region?: string;
	identifier?: {
		type?: string;
		details?: string;
	};
	events?: {
		type?: string;
		startDate?: string;
		endDate?: string;
		submitter?: {
			name?: string;
			organization?: string;
		};
		location?: {
			type?: string;
			details?: string;
		};
		ageClass?: string;
		samples?: string;
	};
}

export interface SearchResult {
	results: unknown[];
}

export class SearchService {
	_healthIDIndexedForm(healthId): HealthIDIndexedForm {
		const built = {
			id: healthId.id,
			year: 0,
			wlhID: healthId.wlh_id,
			creationDate: healthId.created_at?.getTime() || null,
			creator: null,
			currentStatus: healthId.initial_status,
			purpose: healthId.purpose,
			requesterFirstName: healthId.requester_first_name,
			requesterLastName: healthId.requester_last_name,
			lastEventType: null,
			lastEventDate: null,
			requesterOrganization: null,
			species: healthId.species,
			homeRegion: healthId.home_region
		};

		if (healthId.persisted_form_state !== null) {
			if (healthId.persisted_form_state.metadata.apiVersion === '20230119') {
				console.log(`ID ${healthId.wlh_id} getting special treatment`);
				console.log(JSON.stringify(healthId, null, 2));
			} else {
				log.info(`ID ${healthId.wlh_id} has rudimentary data only`);
			}
		}

		return built;
	}

	_sanitizedSearchResults(esResult: SearchResponse<unknown, Record<string, AggregationsAggregate>>): SearchResult {
		return {
			results: esResult.hits.hits.map(r => r._source)
		};
	}

	async _createMapping(client: Client) {
		//client.p
	}

	async reindexAll() {
		const client = new Client({node: Config.ELASTICSEARCH_URL});
		const indexName = `${Config.ELASTICSEARCH_INDEX}-primary`;

		log.info('bulk reindex starting');

		await client.indices.delete({
			index: indexName,
			ignore_unavailable: true
		});

		await client.indices.create({
			index: indexName,
			mappings: {
				properties: {
					wlhID: {
						type: 'text',
						copy_to: 'keywords'
					},
					species: {
						type: 'text',
						copy_to: 'keywords'
					},
					keywords: {
						type: 'text'
					}
				}
			}
		});

		const all = await HealthIDsService.listIDsByYear(pool);

		for (const current of all) {
			try {
				const detail = await HealthIDsService.getId(pool, current.id);
				const mapped = this._healthIDIndexedForm(detail);

				log.debug(`'Mapping object: ${JSON.stringify(mapped)}`);
				await client.index({
					index: indexName,
					document: mapped
				});
			} catch (e) {
				log.error(`Error ${e} when processing ID ${JSON.stringify(current)}`);
			}
		}

		log.info('bulk reindex finished');
	}

	async wildlifeIDSearch(params: SearchRequest): Promise<SearchResult> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});
		const indexName = `${Config.ELASTICSEARCH_INDEX}-primary`;

		const result: SearchResponse<unknown, Record<string, AggregationsAggregate>> = await client.search({
			body: searchRequestToESQuery(params),
			index: indexName
		});

		return this._sanitizedSearchResults(result);
	}
}

function searchRequestToESQuery(params: SearchRequest) {
	let queryBuilder = esb.requestBodySearch();

	const scoringQueries = [];
	if (_.has(params, 'keywords')) {
		for (const keyword of params.keywords) {
			scoringQueries.push(esb.fuzzyQuery('keywords', keyword));
		}
	}

	const filteringQueries = [];

	if (_.has(params, 'region') && params.region !== null && params.region.trim().length > 0) {
		filteringQueries.push(esb.matchQuery('homeRegion', params.region));
	}
	if (_.has(params, 'purpose') && params.purpose !== null && params.purpose.trim().length > 0) {
		filteringQueries.push(esb.matchQuery('purpose', params.purpose));
	}

	if (filteringQueries.length == 0 && scoringQueries.length == 0) {
		// special case, just show the last 50
		queryBuilder = queryBuilder.query(esb.matchAllQuery());
		queryBuilder = queryBuilder.sort(esb.sort('creationDate', 'desc'));
		queryBuilder = queryBuilder.size(50);
		log.info(queryBuilder.toJSON());
		return queryBuilder.toJSON();
	}

	const composedQuery = esb.boolQuery();

	if (filteringQueries.length > 0) {
		composedQuery.filter(filteringQueries);
	}

	if (scoringQueries.length > 0) {
		composedQuery.should(scoringQueries);
		composedQuery.minimumShouldMatch(1);
	}

	queryBuilder.query(composedQuery);

	queryBuilder = queryBuilder.sorts([esb.sort('_score', 'desc'), esb.sort('creationDate', 'desc')]);

	queryBuilder = queryBuilder.size(100);

	log.info(queryBuilder.toJSON());

	return queryBuilder.toJSON();
}
