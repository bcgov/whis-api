const SCHEMA = 'whis';

async function up(knex) {
	await knex.raw(`
		create schema ${SCHEMA};
	`);
}

async function down(knex) {
	await knex.raw(`
		drop schema ${SCHEMA};
	`);
}

module.exports = {
	SCHEMA,
	down,
	up
};
