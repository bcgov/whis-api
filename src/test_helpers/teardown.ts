import {database, knexClientOptions} from './constants';
import Knex from 'knex';

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
		console.log(error);
		process.exit(1);
	} finally {
		await knex.destroy();
	}
};
