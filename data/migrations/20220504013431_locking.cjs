const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		create table ${SCHEMA}.generation_lock
		(
			id       BIGSERIAL PRIMARY KEY,
			email    VARCHAR(255)             NOT NULL,
			acquired timestamp with time zone not null default current_timestamp,
			expires  timestamp with time zone not null default current_timestamp + interval '30 minutes',
			released boolean                  not null default false,
			CONSTRAINT overlapping_expiry_times EXCLUDE USING GIST (tstzrange(acquired, expires) WITH && ) where (not released)
		);

		create view ${SCHEMA}.generation_lock_holder AS
		(
		select id, email, acquired, expires
		from ${SCHEMA}.generation_lock
		where (not released)
			and (tstzrange(acquired, expires) @> current_timestamp)
			);
	`);
}

async function down(knex) {
	await knex.raw(`
		DROP table ${SCHEMA}.generation_lock;
	`);
}

module.exports = {
	down,
	up
};
