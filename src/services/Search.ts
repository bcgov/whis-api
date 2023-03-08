import {Client} from '@elastic/elasticsearch';

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
	homeRegion: string | null;
}

export interface HealthIDSearchParams {
	id?: number;
	year?: number;
	wlhID?: string;
	keywords?: string;
	sequenceNumberMinimum?: number | null;
	sequenceNumberMaximum?: number | null;
	creationDateMinimum?: number | null; //millis since epoch
	creationDateMaximum?: number | null; //millis since epoch
	creator?: string;
	currentStatus?: string;
	purpose?: string;
	requester?: string;
	requesterOrganization?: string;
	species?: string;
	homeRegion?: string;
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
			requesterOrganization: null,
			species: healthId.species,
			homeRegion: healthId.home_region
		};

		if (healthId.id == 2070) {
			console.dir(healthId);
		}

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

	async wildlifeIDSearch(params: HealthIDSearchParams): Promise<SearchResult> {
		const client = new Client({node: Config.ELASTICSEARCH_URL});
		const indexName = `${Config.ELASTICSEARCH_INDEX}-primary`;

		const result: SearchResponse<unknown, Record<string, AggregationsAggregate>> = await client.search({
			index: indexName,
			size: 100,
			query: {
				match: {
					keywords: params.keywords
				}
			}
		});

		console.dir(result);

		return this._sanitizedSearchResults(result);
	}
}
