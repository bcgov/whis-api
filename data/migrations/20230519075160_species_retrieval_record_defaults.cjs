async function up(knex) {
	await knex.raw(`
    set search_path to whis,public;

		alter table species_retrieval_record alter column retrieved_at set default current_timestamp;
		alter table species_retrieval_record alter column retrieved_at set not null;

  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
