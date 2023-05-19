async function up(knex) {
	await knex.raw(`
		create schema whis;

		set search_path to whis, public;

		CREATE TABLE application_user
		(
			id    SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE
		);

		CREATE TABLE application_role
		(
			id   SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE
		);

		INSERT INTO application_role (name) VALUES ('BIOLOGIST');

		CREATE TABLE application_role_mapping
		(
			id      SERIAL PRIMARY KEY,
			application_user_id INT NOT NULL REFERENCES application_user (id) ON DELETE CASCADE,
			application_role_id INT NOT NULL REFERENCES application_role (id) ON DELETE CASCADE,
			CONSTRAINT unique_user_role UNIQUE (application_user_id, application_role_id)
		);

		CREATE TYPE access_request_status AS ENUM ('PENDING', 'ACTIONED', 'DECLINED');

		create table application_access_request (
					id    SERIAL PRIMARY KEY,
					email VARCHAR(255) NOT NULL UNIQUE,
					reason TEXT NULL,
					status access_request_status default 'PENDING',
					request_time timestamp without time zone not null default current_timestamp,
					update_time timestamp without time zone not null default current_timestamp
		);
  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
