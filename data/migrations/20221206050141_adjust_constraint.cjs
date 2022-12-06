const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		create unique index id_detail_unique_per_wlh_id on id_detail(wildlife_health_id);
		alter table id_detail drop column region_id;
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
