const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		update code_table set name = 'animal_sex', displayed_name = 'Animal Sex', help_text = 'Animal Sex' where name = 'animal_gender';


	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
