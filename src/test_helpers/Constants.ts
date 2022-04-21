import pg from 'pg';
import dotenv from 'dotenv';

// this is really ugly but I cannot seem to get dynamic typescript imports working in globalSetup
import * as migration_20220413082725_initial from '../../data/migrations/20220413082725_initial';
import * as migration_20220421030358_code_tables from '../../data/migrations/20220421030358_code tables.js';
import * as seed_initial_codes from '../../data/seeds/initial_codes.js';
import * as seed_test_categories from '../../data/test_seeds/test_categories.js';

dotenv.config();

export const database = 'test_cafe_db';

export const knexClientOptions = {
	host: process.env.TEST_DB_HOST,
	port: parseInt(process.env.TEST_DB_PORT),
	user: process.env.TEST_DB_USER,
	password: process.env.TEST_DB_PASSWORD
};

export const createPool = () => {
	const pool = new pg.Pool({
		user: process.env.TEST_DB_USER,
		database,
		password: process.env.TEST_DB_PASSWORD,
		host: process.env.TEST_DB_HOST,
		port: parseInt(process.env.TEST_DB_PORT),
		max: 5
	});

	pool.on('connect', client => {
		client.query('SET search_path TO whis');
	});

	return pool;
};

export const NecessaryMigrations = [migration_20220413082725_initial, migration_20220421030358_code_tables];

export const NecessarySeeds = [seed_initial_codes, seed_test_categories];
