import pg from 'pg';
import dotenv from 'dotenv';

// this is really ugly but I cannot seem to get dynamic typescript imports working in globalSetup
import * as migration_20220413082725_initial from '../../data/migrations/20220413082725_initial.cjs';
import * as migration_20220421030358_code_tables from '../../data/migrations/20220421030358_code tables.cjs';
import * as migration_20220425071832_wildlife_ids from '../../data/migrations/20220425071832_wildlife_ids.cjs';
import * as migration_20220429065221_add_access_requests from '../../data/migrations/20220429065221_add_access_requests.cjs';
import * as migration_20220504013431_locking from '../../data/migrations/20220504013431_locking.cjs';
import * as migration_20220504120123_sequence_trigger from '../../data/migrations/20220504120123_sequence-trigger.cjs';
import * as migration_20220510091411_code_tables_initial from '../../data/migrations/20220510091411_code-tables-initial.cjs';
import * as migration_20220510091705_adjustments_to_id_schema from '../../data/migrations/20220510091705_adjustments-to-id-schema.cjs';
import * as migration_20220510102606_fixup_missing_sequence from '../../data/migrations/20220510102606_fixup-missing-sequence.cjs';
import * as seed_test_categories from '../../data/test_seeds/test_categories.cjs';

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

export const NecessaryMigrations = [
	migration_20220413082725_initial,
	migration_20220421030358_code_tables,
	migration_20220425071832_wildlife_ids,
	migration_20220429065221_add_access_requests,
	migration_20220504013431_locking,
	migration_20220504120123_sequence_trigger,
	migration_20220510091411_code_tables_initial,
	migration_20220510091705_adjustments_to_id_schema,
	migration_20220510102606_fixup_missing_sequence
];

export const NecessarySeeds = [seed_test_categories];
