const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		-- fix a typo in early migration
		UPDATE ${SCHEMA}.year as y set last_sequence_value = coalesce((select max(i.number) from id as i where i.year_id = y.id), 1) where y.name = '2022';
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
