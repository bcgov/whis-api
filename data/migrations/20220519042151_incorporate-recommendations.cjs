const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		CREATE view ${SCHEMA}.id_by_year as (select i.id, i.year_id as year_id, y.name as year, i.number as number, ('WLH-' || y.short_name || '-' || lpad(i.number::text, 6, '0')) as wlh_id from ${SCHEMA}.id as i inner join ${SCHEMA}.year y on i.year_id = y.id order by year desc, number desc);
	`);
}

async function down(knex) {
	await knex.raw(`
		DROP view ${SCHEMA}.id_by_year;
	`);
}

module.exports = {
	down,
	up
};
