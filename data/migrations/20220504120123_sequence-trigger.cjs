const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		create OR REPLACE FUNCTION ${SCHEMA}.update_year_sequence_triggerfunc()
				RETURNS TRIGGER
				LANGUAGE PLPGSQL
		AS
		$$
		BEGIN
				UPDATE ${SCHEMA}.year set last_sequence_value = new.number;
				RETURN NEW;
		END
		$$;

		CREATE TRIGGER update_year_sequence
				AFTER insert
				on ${SCHEMA}.id
				FOR each row
		execute procedure update_year_sequence_triggerfunc();

	`);
}

async function down(knex) {
	await knex.raw(`
		DROP trigger update_year_sequence on ${SCHEMA}.id;
		DROP function ${SCHEMA}.update_year_sequence_triggerfunc;
	`);
}

module.exports = {
	down,
	up
};
