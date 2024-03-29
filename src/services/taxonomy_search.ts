import {Client} from '@elastic/elasticsearch';
import {AggregationsAggregate, QueryDslBoolQuery, SearchHit, SearchRequest, SearchResponse} from '@elastic/elasticsearch/lib/api/types';
import {log} from '../util/log';
import {Config} from '../config';

export interface ITaxonomySource {
	unit_name1: string;
	unit_name2: string;
	unit_name3: string;
	taxon_authority: string;
	code: string;
	tty_kingdom: string;
	tty_name: string;
	english_name: string;
	note: string | null;
	end_date: string | null;
}

/**
 *
 * Service for retreiving and processing taxonomic data from Elasticsearch.
 */
export class TaxonomyService {
	/**
	 *
	 * Performs a query in Elasticsearch based on the given search criteria
	 * @param {SearchRequest} searchRequest The Elastic search request object
	 * @returns {Promise<SearchResponse<ITaxonomySource, Record<string, AggregationsAggregate>> | undefined>}
	 * Promise resolving the search results from Elasticsearch
	 */
	async _elasticSearch(searchRequest: SearchRequest): Promise<SearchResponse<ITaxonomySource, Record<string, AggregationsAggregate>> | undefined> {
		try {
			const client = new Client({node: Config.TAXONOMY_ES_URL});

			return client.search({
				index: Config.TAXONOMY_ES_INDEX,
				...searchRequest
			});
		} catch (error) {
			log.debug({label: 'elasticSearch', message: 'error', error});
		}
	}

	/**
	 *
	 * Sanitizes species data retrieved from Elasticsearch.
	 * @param {SearchHit<ITaxonomySource>[]} data The data response from ElasticSearch
	 * @returns {{ id: string, label: string }[]} An ID and label pair for each taxonomic code
	 * @memberof TaxonomyService
	 */
	_sanitizeSpeciesData = (data: SearchHit<ITaxonomySource>[]): {id: string; label: string}[] => {
		return data.map((item: SearchHit<ITaxonomySource>) => {
			const {_id: id, _source} = item;

			const label = [
				_source?.code,
				[
					[_source?.tty_kingdom, _source?.tty_name].filter(Boolean).join(' '),
					[_source?.unit_name1, _source?.unit_name2, _source?.unit_name3].filter(Boolean).join(' '),
					_source?.english_name
				]
					.filter(Boolean)
					.join(', ')
			]
				.filter(Boolean)
				.join(': ');

			return {id, label};
		});
	};

	/**
	 *
	 * Searches the taxonomy Elasticsearch index by taxonomic code IDs
	 * @param {string[] | number[]} ids The array of taxonomic code IDs
	 * @return {Promise<(ITaxonomySource | undefined)[]>} The source of the response from Elasticsearch
	 * @memberof TaxonomyService
	 */
	async getTaxonomyFromIds(ids: string[] | number[]) {
		const response = await this._elasticSearch({
			query: {
				terms: {
					_id: ids
				}
			}
		});

		return (response && response.hits.hits.map(item => item._source)) || [];
	}

	/**
	 *
	 * Searches the taxonomy Elasticsearch index by taxonomic code IDs and sanitizes the response
	 * @param {string[] | number[]} ids The array of taxonomic code IDs
	 * @returns {Promise<{ id: string, label: string}[]>} Promise resolving an ID and label pair for each taxonomic code
	 * @memberof TaxonomyService
	 */
	async getSpeciesFromIds(ids: string[] | number[]): Promise<{id: string; label: string}[]> {
		const response = await this._elasticSearch({
			query: {
				terms: {
					_id: ids
				}
			}
		});

		return response ? this._sanitizeSpeciesData(response.hits.hits) : [];
	}

	/**
	 *
	 * Maps a taxonomic search term to an Elasticsearch query, then performs the query and sanitizes the response.
	 * The query also includes a boolean match to only include records whose `end_date` field is either
	 * undefined/null or is a date that hasn't occurred yet. This filtering is not done on similar ES queries,
	 * since we must still be able to search by a given taxonomic code ID, even if is one that is expired.
	 *
	 * @param {string} term The search term string
	 * @returns {Promise<{ id: string, label: string}[]>} Promise resolving an ID and label pair for each taxonomic code
	 * @memberof TaxonomyService
	 */
	async searchSpecies(term: string): Promise<{id: string; label: string}[]> {
		const searchConfig: object[] = [];

		const splitTerms = term.split(' ');

		splitTerms.forEach((item: string) => {
			searchConfig.push({
				wildcard: {
					english_name: {value: `*${item}*`, boost: 4.0, case_insensitive: true}
				}
			});
			searchConfig.push({
				wildcard: {unit_name1: {value: `*${item}*`, boost: 3.0, case_insensitive: true}}
			});
			searchConfig.push({
				wildcard: {unit_name2: {value: `*${item}*`, boost: 3.0, case_insensitive: true}}
			});
			searchConfig.push({
				wildcard: {unit_name3: {value: `*${item}*`, boost: 3.0, case_insensitive: true}}
			});
			searchConfig.push({wildcard: {code: {value: `*${item}*`, boost: 2, case_insensitive: true}}});
			searchConfig.push({
				wildcard: {tty_kingdom: {value: `*${item}*`, boost: 1.0, case_insensitive: true}}
			});
		});

		const response = await this._elasticSearch({
			query: {
				bool: {
					must: [
						{
							bool: {
								should: searchConfig
							}
						},
						{
							bool: {
								minimum_should_match: 1,
								should: [
									{
										bool: {
											must_not: {
												exists: {
													field: 'end_date'
												}
											}
										}
									},
									{
										range: {
											end_date: {
												gt: 'now'
											}
										}
									}
								]
							}
						}
					]
				} as QueryDslBoolQuery
			}
		});

		return response ? this._sanitizeSpeciesData(response.hits.hits) : [];
	}

	_formatEnrichedData = (data: SearchHit<ITaxonomySource>): {scientificName: string; englishName: string} => {
		const scientificName = [data._source?.unit_name1, data._source?.unit_name2, data._source?.unit_name3].filter(Boolean).join(' ') || '';
		const englishName = data._source?.english_name || '';

		return {scientificName, englishName};
	};

	/**
	 * Fetch formatted taxonomy information for a specific taxon code.
	 *
	 * @param {string} taxonCode
	 * @return {*}  {(Promise<{ scientificName: string; englishName: string } | null>)}
	 * @memberof TaxonomyService
	 */
	async getEnrichedDataForSpeciesCode(taxonCode: string): Promise<{scientificName: string; englishName: string} | null> {
		const response = await this._elasticSearch({
			query: {
				bool: {
					must: [
						{
							term: {
								'code.keyword': taxonCode.toUpperCase()
							}
						},
						{
							bool: {
								minimum_should_match: 1,
								should: [
									{
										bool: {
											must_not: {
												exists: {
													field: 'end_date'
												}
											}
										}
									}
								]
							}
						}
					]
				} as QueryDslBoolQuery
			}
		});

		return response ? this._formatEnrichedData(response.hits.hits[0]) : null;
	}
}
