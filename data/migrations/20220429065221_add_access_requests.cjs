const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		CREATE TYPE ${SCHEMA}.access_request_status AS ENUM ('PENDING', 'ACTIONED', 'DECLINED');

		create table ${SCHEMA}.access_request (
					id    SERIAL PRIMARY KEY,
					email VARCHAR(255) NOT NULL UNIQUE,
					reason TEXT NULL,
					status ${SCHEMA}.access_request_status default 'PENDING',
					request_time timestamp with time zone not null default current_timestamp,
					update_time timestamp with time zone not null default current_timestamp
		);

	`);
}

async function down(knex) {
	await knex.raw(`
		DROP table ${SCHEMA}.access_request;
		DROP TYPE ${SCHEMA}.access_request_status;
	`);
}

module.exports = {
	down,
	up
};
