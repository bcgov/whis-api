const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`

		CREATE TABLE ${SCHEMA}.user
		(
			id    SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE
		);

		CREATE TABLE ${SCHEMA}.role
		(
			id   SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE
		);

		INSERT INTO role (name)
		VALUES ('BIOLOGIST');

		CREATE TABLE ${SCHEMA}.role_mapping
		(
			id      SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES ${SCHEMA}.user (id) ON DELETE CASCADE,
			role_id INT NOT NULL REFERENCES ${SCHEMA}.role (id) ON DELETE CASCADE,
			CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
		);

		CREATE TABLE ${SCHEMA}.year
		(
			id                  SERIAL PRIMARY KEY,
			name                VARCHAR(255) NOT NULL UNIQUE,
			short_name          VARCHAR(8)   NOT NULL UNIQUE,
			starts              DATE         NOT NULL,
			ends                DATE         NOT NULL,
			last_sequence_value INT NULL DEFAULT NULL
		);

		INSERT INTO ${SCHEMA}.year (name, short_name, starts, ends)
		VALUES ('2022',
		        '2022',
		        '2022-01-1',
		        '2022-12-12');

		CREATE TABLE ${SCHEMA}.generation_record
		(
			id         SERIAL PRIMARY KEY,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			user_id    INT       NOT NULL REFERENCES ${SCHEMA}.user (id) ON DELETE RESTRICT
		);

		CREATE TABLE ${SCHEMA}.id
		(
			id                   SERIAL PRIMARY KEY,
			year_id              INT NOT NULL REFERENCES ${SCHEMA}.year (id) ON DELETE RESTRICT,
			"number"             INT NOT NULL CHECK ("number" > 0),
			generation_record_id INT NULL REFERENCES ${SCHEMA}.generation_record(id) ON DELETE SET NULL,
			CONSTRAINT unique_year_number UNIQUE (year_id, "number")
		);

		CREATE SEQUENCE ${SCHEMA}.wildlife_id_generator AS INT INCREMENT BY 1 START 1 OWNED BY ${SCHEMA}.id."number";

		ALTER TABLE ${SCHEMA}.id ALTER COLUMN "number" SET DEFAULT nextval('${SCHEMA}.wildlife_id_generator');

	`);
}

async function down(knex) {
	await knex.raw(`
		DROP TABLE ${SCHEMA}.id;
		DROP TABLE ${SCHEMA}.generation_record;
		DROP TABLE ${SCHEMA}.year;
		DROP TABLE ${SCHEMA}.role_mapping;
		DROP TABLE ${SCHEMA}.role;
		DROP TABLE ${SCHEMA}.user;

		DROP SEQUENCE wildlife_id_generator;

	`);
}

module.exports = {
	down,
	up
};
