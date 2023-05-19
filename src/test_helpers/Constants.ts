import pg from 'pg';
import dotenv from 'dotenv';

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

export const NecessaryMigrations = [];

export const NecessarySeeds = [];
