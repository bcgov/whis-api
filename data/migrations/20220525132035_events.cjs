const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		alter table ${SCHEMA}.generation_lock
			alter column expires set default current_timestamp + interval '3 minutes';

		create table ${SCHEMA}.region
		(
			id        SERIAL PRIMARY KEY,
			name      varchar(255) not null,
			effective DATE         NOT NULL default current_date,
			expires   DATE         NULL
		);

		create table ${SCHEMA}.id_detail
		(
			id                 SERIAL PRIMARY KEY,
			wildlife_health_id integer not null references ${SCHEMA}.id (id) on delete restrict,
			region_id          integer not null references ${SCHEMA}.region (id) on delete restrict
		);

		create table ${SCHEMA}.event
		(
			id                 SERIAL PRIMARY KEY,
			wildlife_health_id integer      not null references ${SCHEMA}.id (id) on update cascade on delete restrict,
			event_date         date         not null default current_date,
			recorded           date         not null default current_date,
			event              varchar(255) not null,
			user_id            INT          NOT NULL REFERENCES ${SCHEMA}.user (id) on update cascade ON DELETE RESTRICT
		);

		insert into region(id, name)
		values (1, 'British Columbia');

		insert into region(id, name)
		values (2, 'Vancouver Island');

		select setval('region_id_seq', 3);

		alter table ${SCHEMA}.generation_record
			add column species varchar(255);

		alter table ${SCHEMA}.generation_record
			add column purpose varchar(255);

		alter table ${SCHEMA}.generation_record
			add column project varchar(255);

		alter table ${SCHEMA}.generation_record
			add column reason varchar(255);

		alter table ${SCHEMA}.generation_record
			add column region_id int not null references region (id) on update cascade on delete restrict default 1;
	`);
}

async function down(knex) {
	await knex.raw(`

		alter table ${SCHEMA}.generation_record
			drop column species;

		alter table ${SCHEMA}.generation_record
			drop column purpose;

		alter table ${SCHEMA}.generation_record
			drop column project;

		alter table ${SCHEMA}.generation_record
			drop column reason;

		drop table ${SCHEMA}.event;
		drop table ${SCHEMA}.id_detail;
		drop table ${SCHEMA}.region;
	`);
}

module.exports = {
	down,
	up
};
