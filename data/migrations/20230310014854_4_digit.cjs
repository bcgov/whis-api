const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		CREATE OR REPLACE view ${SCHEMA}.id_by_year as (select i.id,
       i.year_id as year_id,
       y.name as year,
       i.number as number,
       (y.short_name || '-' || (select case when length(i.number::text) < 4 then lpad(i.number::text, 4, '0') else i.number::text end)) as wlh_id
				from ${SCHEMA}.id as i inner join ${SCHEMA}.year y on i.year_id = y.id order by year desc, number desc);

		-- fix the years
		update year y set short_name = right(date_part('year', y.starts)::text, 2);

		-- fix any saved json objects
		update id_detail as detail set persisted_form_state = (select jsonb_set(detail.persisted_form_state::jsonb, '{metadata, wildlifeHealthId}', to_jsonb(iby.wlh_id), false) from id_by_year iby where iby.id = detail.wildlife_health_id);
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
