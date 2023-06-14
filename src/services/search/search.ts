import {Client} from '@elastic/elasticsearch';
import esb from 'elastic-builder';
import _ from 'lodash';

import {log} from '../../util/log';
import {Config} from '../../config';
import {AggregationsAggregate, QueryDslBoolQuery, SearchResponse} from '@elastic/elasticsearch/lib/api/types';
import {HEALTH_IDS_INDEX_NAME} from "./search_indexer";


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

	_sanitizedSearchResults(esResult: SearchResponse<unknown, Record<string, AggregationsAggregate>>): SearchResult {
		return {
			results: esResult.hits.hits.map(r => r._source)
		};
	}

	async wildlifeIDSearch(params: SearchRequest): Promise<SearchResult> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});

		const result: SearchResponse<unknown, Record<string, AggregationsAggregate>> = await client.search({
			body: searchRequestToESQuery(params),
			index: HEALTH_IDS_INDEX_NAME
		});

		return this._sanitizedSearchResults(result);
	}

	async searchContactListPerson(term: string): Promise<{ id: string; label: string, document: unknown }[]> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});

		const searchConfig: object[] = [];

		console.log(`term: '${term}'`);

		term.split(/(\s+)/).forEach((t: string) => {
			if (t.length === 0 || t.match(/(\s+)/)) {
				// skip empty tokens
				return;
			}
			searchConfig.push(
				{
					bool: {
						should: [
							{
								prefix: {
									firstName: {
										value: t,
										boost: 1.5,
										case_insensitive: true
									}
								}
							},
							{
								prefix: {
									lastName: {
										value: t,
										boost: 1.5,
										case_insensitive: true
									}
								}
							},
							{
								prefix: {
									organizationalRole: {
										value: t,
										case_insensitive: true
									}
								}
							},
							{
								match: {
									comments: {
										query: t,
									}
								}
							},
							{
								wildcard: {
									'organization.name': {
										value: `*${t}*`,
										boost: 3.0,
										case_insensitive: true
									}
								}
							}
						]
					}
				}
			);
		});

		console.dir(JSON.stringify(searchConfig, null, 2));

		const response = await client.search({
			query: {
				bool: {
					must: searchConfig
				}
			}
		});

		const mapResults = ({_id, _source}): { id, label, document } => {
			return {
				id: _id,
				label: `${_source.firstName} ${_source.lastName}, ${_source.organizationalRole} at ${_source.organization?.name || 'Unknown'}`,
				document: _source
			}
		}

		// @ts-ignore
		return response ? response.hits.hits.map(mapResults) : [];
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
