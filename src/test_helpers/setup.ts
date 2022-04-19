import {database, knexClientOptions, NecessaryMigrations, NecessarySeeds} from './constants';
import knexClient, {Knex} from 'knex';
import Migration = Knex.Migration;
import MigrationSource = Knex.MigrationSource;
import SeedSource = Knex.SeedSource;
import Seed = Knex.Seed;

class CustomMigrationSource implements MigrationSource<string> {
	async getMigrations() {
		return Object.keys(NecessaryMigrations);
	}

	getMigrationName(migration: string): string {
		return '' + migration;
	}

	async getMigration(migration: string): Promise<Migration> {
		return NecessaryMigrations[migration];
	}
}

class CustomSeedSource implements SeedSource<string> {
	async getSeeds(): Promise<string[]> {
		return Object.keys(NecessarySeeds);
	}

	async getSeed(seed: string): Promise<Seed> {
		return NecessarySeeds[seed];
	}
}

async function createTestDatabase() {
	const knex = knexClient({
		client: 'pg',
		searchPath: ['whis', 'public'],
		connection: {
			...knexClientOptions,
			database: 'postgres'
		}
	});
	try {
		await knex.raw(`DROP DATABASE IF EXISTS ${database}`);
		await knex.raw(`CREATE DATABASE ${database}`);
	} catch (error) {
		throw new Error(error);
	} finally {
		await knex.destroy();
	}
}

async function seedTestDatabase() {
	const knex = knexClient({
		client: 'pg',
		searchPath: ['whis', 'public'],
		connection: {
			...knexClientOptions,
			database
		}
	});

	try {
		await knex.migrate.latest({migrationSource: new CustomMigrationSource()});
		await knex.seed.run({
			seedSource: new CustomSeedSource()
		});
	} catch (error) {
		throw new Error(error);
	} finally {
		await knex.destroy();
	}
}

export default async () => {
	try {
		await createTestDatabase();
		await seedTestDatabase();
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};
