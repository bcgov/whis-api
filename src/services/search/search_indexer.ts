import {clearInterval} from 'timers';
import HealthIDsService from '../health_ids';
import {pool} from '../../server';
import {log} from '../../util/log';

const DELAY = 1000 * 5;

class Indexer {
	private timer: NodeJS.Timer;

	private async process() {
		console.log(`indexer run ${new Date()}`);

		// species_in_use
		// wlh_id
		// contacts

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

			console.log(`indexer run complete`);
		}
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
		this.timer = setInterval(this.process, DELAY);
	}

	stop() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}
}

export default Indexer;
