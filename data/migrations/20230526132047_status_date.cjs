async function up(knex) {
	await knex.raw(`
    set search_path to whis, public;

		alter table wildlife_health_id_status_history add column if not exists status_change_date date not null default current_date;

  `);
}

async function down(knex) {
	await knex.raw(`
    set search_path to whis, public;

		alter table wildlife_health_id_status_history drop column if exists status_change_date;

  `);
}

module.exports = {
	down,
	up
};
