const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		alter table id_detail add column persisted_form_state json null;
	`);
}

async function down(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		alter table id_detail drop column persisted_form_state;
	`);
}

module.exports = {
	down,
	up
};
