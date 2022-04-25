const {SCHEMA} = require('../migrations/20220413082725_initial.cjs');

async function seed(knex) {
	// to test the recursive structure of categories
	await knex.raw(`

		INSERT INTO ${SCHEMA}.category(name, displayed_name)
		VALUES ('vehicles', 'Vehicles');
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('cars', 'Cars', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'vehicles'));
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('motorcycles', 'Motorcycles', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'vehicles'));
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('sports', 'Sports', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'cars'));
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('touring', 'Touring', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'cars'));
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('4door', 'Four Door', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'touring'));

		INSERT INTO ${SCHEMA}.category(name, displayed_name)
		VALUES ('instruments', 'Instruments');
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('string', 'String', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'instruments'));
		INSERT INTO ${SCHEMA}.category(name, displayed_name, parent_id)
		VALUES ('percussion', 'Percussion', (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'instruments'));


		INSERT INTO ${SCHEMA}.code_table(name, displayed_name)
		VALUES ('unit_test_codes_category', 'Category Recursion Unit Test');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, category_id)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'tcfb',
		        'ThunderCougarFalconBird',
		        CURRENT_DATE - INTERVAL '1 years',
		        (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'sports'));

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, category_id)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'uke',
		        'Ukulele',
		        CURRENT_DATE - INTERVAL '1 years',
		        (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'string'));

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, category_id)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'vuvuzela',
		        'Vuvuzela',
		        CURRENT_DATE - INTERVAL '1 years',
		        (SELECT id FROM ${SCHEMA}.category WHERE name LIKE 'instruments'));

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, category_id)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'espresso',
		        'Espresso',
		        CURRENT_DATE - INTERVAL '1 years',
		        NULL);

		-- do some testing on temporal specifiers

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, expires)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'expired_milk',
		        'Expired Milk',
		        CURRENT_DATE - INTERVAL '10 years',
		        CURRENT_DATE - INTERVAL '5 years');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, expires)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'fresh_milk',
		        'Fresh Milk',
		        CURRENT_DATE - INTERVAL '5 years',
		        CURRENT_DATE + INTERVAL '3 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, expires)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'future_milk',
		        'Future Milk',
		        CURRENT_DATE + INTERVAL '4 days',
		        CURRENT_DATE + INTERVAL '12 days');

		INSERT INTO ${SCHEMA}.code(code_table_id, value, displayed_value, effective, expires)
		VALUES ((SELECT id FROM ${SCHEMA}.code_table WHERE name = 'unit_test_codes_category'),
		        'deep_future_milk',
		        'Deep Future Milk',
		        CURRENT_DATE + INTERVAL '2 years',
		        NULL); -- lasts until the end of time
	`);
}

module.exports = {
	seed
};
