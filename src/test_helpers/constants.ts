import pg from 'pg';
import dotenv from 'dotenv';

// this is really ugly but I cannot seem to get dynamic typescript imports working in globalSetup
import * as migration_20220413082725_initial from '../../data/migrations/20220413082725_initial';

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

export const NecessaryMigrations = [migration_20220413082725_initial];

export const NecessarySeeds = [];
