async function up(knex) {
	await knex.raw(`
    set search_path to whis, public;

		alter table wildlife_health_id alter column species_retrieval_record_id drop not null;

  `);
}

async function down(knex) {
	await knex.raw(`
    set search_path to whis, public;

		alter table wildlife_health_id alter column species_retrieval_record_id set not null;

  `);
}

module.exports = {
	down,
	up
};
