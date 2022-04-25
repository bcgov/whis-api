const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`

		CREATE TABLE ${SCHEMA}.code_table
		(
			id             SERIAL PRIMARY KEY,
			name           VARCHAR(48)  NOT NULL UNIQUE,
			displayed_name VARCHAR(255) NOT NULL UNIQUE,
			help_text      TEXT NULL
		);

		CREATE TABLE ${SCHEMA}.category
		(
			id             SERIAL PRIMARY KEY,
			parent_id      INT NULL REFERENCES ${SCHEMA}.category(id) ON DELETE CASCADE,
			name           VARCHAR(48)  NOT NULL UNIQUE,
			displayed_name VARCHAR(255) NOT NULL UNIQUE
		);

		CREATE TABLE ${SCHEMA}.code
		(
			id              SERIAL8 PRIMARY KEY,
			code_table_id   INT          NOT NULL REFERENCES ${SCHEMA}.code_table (id) ON DELETE RESTRICT,
			category_id     INT NULL REFERENCES ${SCHEMA}.category (id) ON DELETE RESTRICT,
			value           VARCHAR(255) NOT NULL,
			displayed_value VARCHAR(255) NOT NULL,
			help_text       TEXT NULL,
			effective       DATE         NOT NULL,
			expires         DATE NULL,
			UNIQUE (code_table_id, category_id, value, effective, expires)
		);

		-- convenience view to recursively build the category path back to root
		CREATE VIEW ${SCHEMA}.category_expanded AS
		WITH RECURSIVE cte(id, path) AS
			               (
				               SELECT id,
				                      ARRAY[CAST(NAME AS VARCHAR)] AS path
				               FROM ${SCHEMA}.category
				               WHERE parent_id IS NULL
				               UNION ALL
				               SELECT t.id, path || CAST(t.name AS VARCHAR)
				               FROM ${SCHEMA}.category AS t
					                    JOIN cte            r ON t.parent_id = r.id
			               )
		SELECT *
		FROM cte;


	`);

	// language=SQL format=false
	await knex.raw(`
		COMMENT ON TABLE ${SCHEMA}.code_table IS 'Reference codes for use throughout the application';
		COMMENT ON COLUMN ${SCHEMA}.code_table.name IS 'Short, unique name for programmatic reference (not normally displayed)';
		COMMENT ON COLUMN ${SCHEMA}.code_table.displayed_name IS 'Human-readable short description for use in eg. dropdown lists';
		COMMENT ON COLUMN ${SCHEMA}.code_table.help_text IS 'Optional descriptive text to aid in making a selection (for display in UI)';

		COMMENT ON TABLE ${SCHEMA}.category IS 'Code categories when the individual codes have a tree-like structure. Not considered part of the code; used for display and sorting purposes';
		COMMENT ON COLUMN ${SCHEMA}.category.parent_id IS 'FK to self(id) for nested taxonomies';
		COMMENT ON COLUMN ${SCHEMA}.category.name IS 'Short, unique name for programmatic reference (not normally displayed)';
		COMMENT ON COLUMN ${SCHEMA}.category.displayed_name IS 'Human-readable short description for use in eg. dropdown lists';

		COMMENT ON TABLE ${SCHEMA}.code IS '';
		COMMENT ON COLUMN ${SCHEMA}.code.code_table_id IS 'FK to code_table(id)';
		COMMENT ON COLUMN ${SCHEMA}.code.value IS 'Short value for programmatic use.';
		COMMENT ON COLUMN ${SCHEMA}.code.displayed_value IS 'Human-readable value for display in eg. dropdown lists';
		COMMENT ON COLUMN ${SCHEMA}.code.help_text IS 'Optional descriptive text to aid in making a decision';
		COMMENT ON COLUMN ${SCHEMA}.code.effective IS 'The start date for this code';
		COMMENT ON COLUMN ${SCHEMA}.code.expires IS 'The (optional) end date of this code. Behaviour is undefined if two codes overlap temporally.';
`);
}

async function down(knex) {
	await knex.raw(`
		DROP VIEW ${SCHEMA}.category_expanded;
		DROP TABLE ${SCHEMA}.code;
		DROP TABLE ${SCHEMA}.category;
		DROP TABLE ${SCHEMA}.code_table;
	`);
}

module.exports = {
	down,
	up
};
