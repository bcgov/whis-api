import {database, knexClientOptions} from './Constants';
import Knex from 'knex';
import {log} from '../util/Log';

export default async () => {
	const knex = Knex({
		client: 'pg',
		connection: {
			...knexClientOptions,
			database: 'postgres'
		}
	});

	try {
		await knex.raw(`DROP DATABASE IF EXISTS ${database}`);
	} catch (error) {
		log.error(error.toString());
		process.exit(1);
	} finally {
		await knex.destroy();
	}
};
