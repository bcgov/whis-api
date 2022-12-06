const {SCHEMA} = require('./20220413082725_initial.cjs');

async function up(knex) {
	await knex.raw(`
		set search_path to ${SCHEMA};

		create type initial_status_enum as enum('ASSIGNED', 'UNASSIGNED');

		alter table generation_record drop column region_id;
		alter table generation_record add column initial_status initial_status_enum not null default 'UNASSIGNED';
		alter table generation_record add column home_region varchar(255);
		alter table generation_record add column project_detail text;
		alter table generation_record add column requester_first_name varchar(255) not null default 'Unknown';
		alter table generation_record add column requester_last_name varchar(255) not null default 'Unknown';
		alter table generation_record add column requester_region varchar(255);
		alter table generation_record add column requester_organization varchar(255);
		alter table generation_record add column requester_phone varchar(255);
		alter table generation_record add column requester_email varchar(255);
		alter table generation_record add column requester_role varchar(255);

		alter table generation_record alter column requester_first_name drop default;
		alter table generation_record alter column requester_last_name drop default;
	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
