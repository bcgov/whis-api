import * as dotenv from 'dotenv';

dotenv.config();

const config = {
	development: {
		client: 'pg',
		searchPath: ['knex', 'whis'],
		connection: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT,
			database: process.env.DB_DATABASE,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			multipleStatements: true
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'migration',
			directory: __dirname + '/data/migrations',
			schemaName: 'knex',
			extension: 'js'
		},
		seeds: {
			tableName: 'seeds',
			directory: __dirname + '/data/seeds',
			schemaName: 'knex',
			extension: 'js'
		}
	}
};

export default config;
