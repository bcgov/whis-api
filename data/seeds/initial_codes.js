import {SCHEMA} from '../migrations/20220413082725_initial.js';

export async function seed(knex) {
	await knex.raw(`
		delete
		from ${SCHEMA}.code;

		delete
		from ${SCHEMA}.code_table;

		-- wildlife id purpose
		insert into ${SCHEMA}.code_table(name, displayed_name, help_text)
		values ('wlh_id_purpose', 'Purpose', 'Why is this Wildlife Health ID being requested?');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'wlh_id_purpose'),
						'herd_health', 'Heard Health', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'wlh_id_purpose'),
						'passive', 'Passive Surveillance', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'wlh_id_purpose'),
						'targeted', 'Targeted Surveillance', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'wlh_id_purpose'),
						'unknown', 'Unknown', current_date - interval '1 days');

		-- animal gender
		insert into ${SCHEMA}.code_table(name, displayed_name, help_text)
		values ('animal_gender', 'Animal Gender', 'Gender of the animal');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_gender'),
						'male', 'Male', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_gender'),
						'female', 'Female', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_gender'),
						'unknown', 'Unknown', current_date - interval '1 days');

		-- animal age
		insert into ${SCHEMA}.code_table(name, displayed_name, help_text)
		values ('animal_age', 'Animal Age', 'Age of the animal at the recorded event');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_age'),
						'young', 'Young of the year', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_age'),
						'juvenile', 'Juvenile', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_age'),
						'adult', 'Adult', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_age'),
						'aged_adult', 'Aged Adult', current_date - interval '1 days');

		insert into ${SCHEMA}.code(code_table_id, value, displayed_value, effective)
		values ((select id from ${SCHEMA}.code_table where name = 'animal_age'),
						'unclassified', 'Unclassified', current_date - interval '1 days');


	`);
}
