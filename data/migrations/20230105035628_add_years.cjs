const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		INSERT INTO ${SCHEMA}.year (name, short_name, starts, ends)
		VALUES ('2023',
		        '2023',
		        '2023-01-1',
		        '2023-12-31');

		INSERT INTO ${SCHEMA}.year (name, short_name, starts, ends)
		VALUES ('2024',
		        '2024',
		        '2024-01-1',
		        '2024-12-31');

		INSERT INTO ${SCHEMA}.year (name, short_name, starts, ends)
		VALUES ('2025',
		        '2025',
		        '2025-01-1',
		        '2025-12-31');
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
