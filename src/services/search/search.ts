import {Client} from '@elastic/elasticsearch';
import esb, {requestBodySearch} from 'elastic-builder';
import _ from 'lodash';

import {log} from '../../util/log';
import {Config} from '../../config';
import {AggregationsAggregate, QueryDslBoolQuery, SearchResponse} from '@elastic/elasticsearch/lib/api/types';
import {CONTACTS_INDEX_NAME, HEALTH_IDS_INDEX_NAME} from './search_indexer';

const RETURNED_FIELDS = ['id', 'creationDate', 'wildlifeHealthId', 'status', 'region', 'primaryPurpose', 'species', 'flagged'];

// this is the form that comes in from the client
interface SearchRequest {
	keywords: string[];
	minimumId: number | null;
	maximumId: number | null;
	namedDateRanges: string[],
	creationStartDate: string,
	creationEndDate: string,
	status: string;
	purpose: string;
	requesterName: string,
	requesterOrganization: number | null;
	speciesId: number | null;
	region: number | null;
	identifierType: string;
	identifierDetails: string;
	eventType: string;
	eventStartDate: string;
	eventEndDate: string;
	eventSubmitterName: string;
	eventSubmitterOrganization: number | null;
	eventLocationType: string;
	eventLocationDetails: string;
	eventAgeClass: string;
	eventSamples: string;
}

export interface SearchResult {
	results: unknown[];
}

export class SearchService {
	async wildlifeIDSearch(params: SearchRequest): Promise<SearchResult> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});

		const result: SearchResponse<unknown, Record<string, AggregationsAggregate>> = await client.search({
			...searchRequestToESQuery(params),
			_source: {
				includes: RETURNED_FIELDS
			},
			index: HEALTH_IDS_INDEX_NAME
		});

		return {
			results: result.hits.hits.map(r => r._source)
		};
	}

	async searchContactListPerson(term: string): Promise<{ id: string; label: string; document: unknown }[]> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});

		const composedQueries = [];

		term.split(/(\s+)/).forEach((t: string) => {
			if (t.length === 0 || t.match(/(\s+)/)) {
				// skip empty tokens
				return;
			}
			const scoringQueries = [];
			scoringQueries.push(esb.prefixQuery('firstName', t).boost(1.5));
			scoringQueries.push(esb.prefixQuery('lastName', t).boost(1.5));
			scoringQueries.push(esb.termQuery('organizationalRole', t));
			scoringQueries.push(esb.matchQuery('comments', t).fuzziness(1));
			scoringQueries.push(esb.wildcardQuery('organization.name', `*${t}*`));
			composedQueries.push(esb.boolQuery().should(scoringQueries).minimumShouldMatch(1));
		});

		const bodySearch = requestBodySearch();
		bodySearch.query(esb.boolQuery().should(composedQueries));
		bodySearch.size(10);
		bodySearch.sort(esb.sort('_score', 'desc'))

		const mapResults = ({_id, _source}): { id; label; document } => {
			return {
				id: _id,
				label: `${_source.firstName} ${_source.lastName}, ${_source.organizationalRole} at ${_source.organization?.name || 'Unknown'}`,
				document: _source
			};
		};

		const response = await client.search({
			...bodySearch.toJSON(),
			index: CONTACTS_INDEX_NAME
		});


		// @ts-ignore
		return response ? response.hits.hits.map(mapResults) : [];
	}
}

function searchRequestToESQuery(params: SearchRequest) {
	let queryBuilder = esb.requestBodySearch();

	const scoringQueries = [];
	if (_.has(params, 'keywords')) {
		for (const keyword of params.keywords) {

			scoringQueries.push(esb.termQuery('wildlifeHealthId', keyword).boost(5));
			scoringQueries.push(esb.termQuery('year.name', keyword).boost(2));

			scoringQueries.push(esb.matchQuery('requester.firstName', keyword).fuzziness(1));
			scoringQueries.push(esb.matchQuery('requester.lastName', keyword).fuzziness(1));

			scoringQueries.push(esb.matchQuery('fulltext', keyword).fuzziness(0));
		}
	}

	const filteringQueries = [];

	if (_.has(params, 'region') && params.region !== null && String(params.region).trim().length > 0) {
		filteringQueries.push(esb.termQuery('region.id', String(params.region)));
	}
	if (_.has(params, 'purpose') && params.purpose !== null && params.purpose.trim().length > 0) {
		filteringQueries.push(esb.termQuery('primaryPurpose.code', params.purpose));
	}
	if (_.has(params, 'status') && params.status !== null && params.status.trim().length > 0) {
		filteringQueries.push(esb.termsQuery('status', params.status));
	}
	if (_.has(params, 'speciesId') && params.speciesId !== null) {
		filteringQueries.push(esb.termQuery('species.taxonomyId', params.speciesId));
	}
	if (_.has(params, 'minimumId') && params.minimumId !== null) {
		filteringQueries.push(esb.rangeQuery('idNumber').gte(params.minimumId));
	}
	if (_.has(params, 'maximumId') && params.maximumId !== null) {
		filteringQueries.push(esb.rangeQuery('idNumber').lte(params.maximumId));
	}

	if (_.has(params, 'requesterName') && params.requesterName !== null && params.requesterName.trim().length > 0) {
		filteringQueries.push(esb.boolQuery().should(
			[
				esb.matchQuery('requester.firstName', params.requesterName).fuzziness(1),
				esb.matchQuery('requester.lastName', params.requesterName).fuzziness(1)
			]
		).minimumShouldMatch(1));
	}

	if (_.has(params, 'requesterOrganization') && params.requesterOrganization !== null) {
		filteringQueries.push(esb.termQuery('requester.contactListEntry.organization.id', params.requesterOrganization));
	}

	const creationDateFilterQueries = [];

	if (_.has(params, 'namedDateRanges') && params.namedDateRanges !== null && params.namedDateRanges.includes('TODAY')) {
		creationDateFilterQueries.push(
			esb.rangeQuery('creationDate').gte("now-1d/d").lte("now/d")
		)
	}

	if (_.has(params, 'namedDateRanges') && params.namedDateRanges !== null && params.namedDateRanges.includes('THIS_WEEK')) {
		creationDateFilterQueries.push(
			esb.rangeQuery('creationDate').gte("now-1w/d").lte("now/d")
		)
	}

	if (_.has(params, 'namedDateRanges') && params.namedDateRanges !== null && params.namedDateRanges.includes('LAST_WEEK')) {
		creationDateFilterQueries.push(
			esb.rangeQuery('creationDate').gte("now-2w/d").lte("now-1w/d")
		)
	}

	if (_.has(params, 'namedDateRanges') && params.namedDateRanges !== null && params.namedDateRanges.includes('LAST_MONTH')) {
		creationDateFilterQueries.push(
			esb.rangeQuery('creationDate').gte("now-1M/d").lte("now/d")
		)
	}

	let manualCreationStartDate = null;
	let manualCreationEndDate = null;

	if (_.has(params, 'creationStartDate') && params.creationStartDate !== null && params.creationStartDate.trim().length > 0) {
		manualCreationStartDate = params.creationStartDate;
	}
	if (_.has(params, 'creationEndDate') && params.creationEndDate !== null && params.creationEndDate.trim().length > 0) {
		manualCreationEndDate = params.creationEndDate;
	}
	if (manualCreationStartDate !== null || manualCreationEndDate !== null) {
		let manualCreationDateFilterQuery = esb.rangeQuery('creationDate');

		if (manualCreationStartDate !== null) {
			manualCreationDateFilterQuery = manualCreationDateFilterQuery.gte(manualCreationStartDate);
		}
		if (manualCreationEndDate !== null) {
			manualCreationDateFilterQuery = manualCreationDateFilterQuery.lte(manualCreationEndDate);
		}

		creationDateFilterQueries.push(manualCreationDateFilterQuery);
	}

	if (creationDateFilterQueries.length > 0) {
		filteringQueries.push(esb.boolQuery().should(creationDateFilterQueries).minimumShouldMatch(1));
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
