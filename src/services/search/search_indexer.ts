import {clearInterval} from 'timers';
import HealthIDsService from '../health_ids';
import {pool} from '../../server';
import {log} from '../../util/log';
import {Config} from '../../config';
import {Client} from '@elastic/elasticsearch';
import {Pool} from 'pg';

const DELAY = 1000 * 10;

const BASE_INDEX_NAME = `${Config.ELASTICSEARCH_INDEX}-primary`;
export const CONTACTS_INDEX_NAME = `${BASE_INDEX_NAME}-contacts`;
export const ORGANIZATION_INDEX_NAME = `${BASE_INDEX_NAME}-organizations`;
export const HEALTH_IDS_INDEX_NAME = `${BASE_INDEX_NAME}-health-ids`;
export const SPECIES_RETRIEVAL_RECORD_INDEX_NAME = `${BASE_INDEX_NAME}-species-in-use`;

class Indexer {
	private timer: NodeJS.Timer;

	async indexContact(client: Client, db: Pool, id: any): Promise<void> {
		const result = await db.query({
			text: 'SELECT json as doc from whis_json_contact_list_person where id = $1',
			values: [id]
		});

		if (result.rows.length !== 1) {
			log.error('Unexpected row count when indexing contact list person');
			return;
		}

		await client.index({
			id: id,
			index: CONTACTS_INDEX_NAME,
			body: result.rows[0]['doc']
		});
	}

	async indexOrganization(client: Client, db: Pool, id: any) {
		const result = await db.query({
			text: 'SELECT json as doc from whis_json_contact_list_organization where id = $1',
			values: [id]
		});

		if (result.rows.length !== 1) {
			log.error('Unexpected row count when indexing contact list organization');
			return;
		}

		await client.index({
			id: id,
			index: ORGANIZATION_INDEX_NAME,
			body: result.rows[0]['doc']
		});
	}

	async indexWildlifeHealthId(client: Client, db: Pool, id: any) {
		const result = await db.query({
			text: 'SELECT json as doc from whis_json_wildlife_health_id where id = $1',
			values: [id]
		});

		if (result.rows.length !== 1) {
			log.error('Unexpected row count when indexing health id');
			return;
		}

		await client.index({
			id: id,
			index: HEALTH_IDS_INDEX_NAME,
			body: result.rows[0]['doc']
		});
	}

	async indexSpeciesRetrievalRecord(client: Client, db: Pool, id: any) {
		const result = await db.query({
			text: 'SELECT json as doc from whis_json_species_retrieval_record where id = $1',
			values: [id]
		});

		if (result.rows.length !== 1) {
			log.error('Unexpected row count when indexing species retrieval record');
			return;
		}

		await client.index({
			id: id,
			index: SPECIES_RETRIEVAL_RECORD_INDEX_NAME,
			body: result.rows[0]['doc']
		});
	}

	private doUpdate = true;

	private async updateMappings(client): Promise<void> {
		if (!this.doUpdate) {
			return;
		}

		await client.indices.delete({
			index: HEALTH_IDS_INDEX_NAME,
			ignore_unavailable: true
		});

		await client.indices.delete({
			index: CONTACTS_INDEX_NAME,
			ignore_unavailable: true
		});

		await client.indices.delete({
			index: ORGANIZATION_INDEX_NAME,
			ignore_unavailable: true
		});

		await client.indices.create({
			index: HEALTH_IDS_INDEX_NAME,
			mappings: {
				properties: {
					creationDate: {
						type: 'date'
					},
					flagged: {
						type: 'boolean'
					},
					status: {
						type: 'keyword'
					},
					wildlifeHealthId: {
						type: 'keyword',
						copy_to: 'fulltext'
					},
					associatedProject: {
						type: 'text',
						copy_to: 'fulltext'
					},
					associatedProjectDetails: {
						type: 'text',
						copy_to: 'fulltext'
					},
					primaryPurpose: {
						type: 'object',
						properties: {
							code: {
								type: 'keyword'
							}
						}
					},
					secondaryPurpose: {
						type: 'object',
						properties: {
							code: {
								type: 'keyword'
							}
						}
					},
					idNumber: {
						type: 'long'
					},
					region: {
						type: 'object',
						properties: {
							id: {
								type: 'long'
							},
							name: {
								type: 'keyword',
								copy_to: 'fulltext'
							}
						}
					},
					requester: {
						type: 'object',
						properties: {
							firstName: {
								type: 'keyword',
								copy_to: 'fulltext'
							},
							lastName: {
								type: 'keyword',
								copy_to: 'fulltext'
							},
							organization: {
								type: 'text',
								copy_to: 'fulltext'
							},
							organizationalRole: {
								type: 'keyword',
								copy_to: 'fulltext'
							}
						}
					},
					events: {
						type: 'nested',
						properties: {
							history: {
								type: 'text',
								copy_to: 'fulltext'
							}
						}
					},
					year: {
						type: 'object',
						properties: {
							name: {
								type: 'keyword',
								copy_to: 'fulltext'
							}
						}
					},
					species: {
						type: 'object',
						properties: {
							taxonomyId: {
								type: 'long'
							},
							code: {
								type: 'keyword'
							},
							englishName: {
								type: 'text',
								copy_to: 'fulltext'
							}
						}
					},
					fulltext: {
						type: 'text'
					}
				}
			}
		});

		this.doUpdate = false;
	}

	private async process() {
		const client = new Client({node: Config.ELASTICSEARCH_URL});

		await this.updateMappings(client);

		console.log(`indexer run ${new Date()}`);

		// contacts
		const contacts_result = await pool.query({
			text: 'SELECT distinct id from contact_list_person order by id asc'
		});
		for (const row of contacts_result.rows) {
			await this.indexContact(client, pool, row['id']);
		}

		// organizations
		const organizations_result = await pool.query({
			text: 'SELECT distinct id from contact_list_organization order by id asc'
		});
		for (const row of organizations_result.rows) {
			await this.indexOrganization(client, pool, row['id']);
		}

		// species in use
		const species_in_use_result = await pool.query({
			text: 'SELECT distinct on (code, unit_name1, unit_name2, unit_name3, taxon_authority, tty_kingdom, tty_name, english_name, note) id from species_retrieval_record'
		});
		for (const row of species_in_use_result.rows) {
			await this.indexSpeciesRetrievalRecord(client, pool, row['id']);
		}

		// health ids
		const health_ids_result = await pool.query({
			text: 'SELECT distinct id from wildlife_health_id order by id asc'
		});
		for (const row of health_ids_result.rows) {
			await this.indexWildlifeHealthId(client, pool, row['id']);
		}

		console.log(`indexer run complete`);

		await client.close();
	}

	/*

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

	 */

	start() {
		this.timer = setInterval(() => this.process(), DELAY);
	}

	stop() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
}

export default Indexer;
