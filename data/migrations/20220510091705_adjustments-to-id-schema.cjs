const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		-- fix a typo in early migration
		UPDATE ${SCHEMA}.year set ends = '2022-12-31' where name = '2022';

		ALTER table ${SCHEMA}.id alter column number set default 0;

		DROP SEQUENCE ${SCHEMA}.wildlife_id_generator;
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
