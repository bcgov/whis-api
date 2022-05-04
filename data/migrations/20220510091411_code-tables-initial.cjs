const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
DELETE
		FROM ${SCHEMA}.code;

		DELETE
		FROM ${SCHEMA}.code_table;

		-- wildlife id purpose
		INSERT INTO ${SCHEMA}.code_table(name, displayed_name, help_text)
		VALUES ('wlh_id_purpose', 'Purpose', 'Why is this Wildlife Health ID being requested?');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'wlh_id_purpose'),
		        'herd_health', 'Heard Health', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'wlh_id_purpose'),
		        'passive', 'Passive Surveillance', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'wlh_id_purpose'),
		        'targeted', 'Targeted Surveillance', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'wlh_id_purpose'),
		        'unknown', 'Unknown', CURRENT_DATE - INTERVAL '1 days');

		-- animal gender
		INSERT INTO ${SCHEMA}.code_table(name, displayed_name, help_text)
		VALUES ('animal_gender', 'Animal Gender', 'Gender of the animal');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_gender'),
		        'male', 'Male', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_gender'),
		        'female', 'Female', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_gender'),
		        'unknown', 'Unknown', CURRENT_DATE - INTERVAL '1 days');

		-- animal age
		INSERT INTO ${SCHEMA}.code_table(name, displayed_name, help_text)
		VALUES ('animal_age', 'Animal Age', 'Age of the animal at the recorded event');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_age'),
		        'young', 'Young of the year', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_age'),
		        'juvenile', 'Juvenile', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_age'),
		        'adult', 'Adult', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_age'),
		        'aged_adult', 'Aged Adult', CURRENT_DATE - INTERVAL '1 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'animal_age'),
		        'unclassified', 'Unclassified', CURRENT_DATE - INTERVAL '1 days');
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
