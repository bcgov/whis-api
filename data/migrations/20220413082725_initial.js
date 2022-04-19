export const SCHEMA = 'whis';

export async function up(knex) {
	await knex.raw(`
		create schema ${SCHEMA};
	`);
}

export async function down(knex) {
	await knex.raw(`
		drop schema ${SCHEMA};
	`);
}
