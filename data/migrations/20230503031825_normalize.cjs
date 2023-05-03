async function up(knex) {
	await knex.raw(`
		set search_path to whis, public;

		drop table if exists event cascade;
		drop table if exists generation_record cascade;
		drop table if exists id cascade;
		drop table if exists id_detail cascade;

		create table contact_list_organization (
		    id serial not null primary key,
				name text not null check ( length(name) >= 2 )
		);

		create table organizational_role (
		    code varchar(64) not null primary key,
		    name varchar(255) not null unique check ( length (name) >= 2 ),
		    sort_order integer not null default 0
		);
		create sequence organizational_role_sort_order as integer increment by 10 start with 100 owned by whis.organizational_role.sort_order;
		alter table organizational_role alter column sort_order set default nextval('organizational_role_sort_order');


		create table contact_list_person (
		    id serial not null primary key,
				first_name text not null  not null check ( length(first_name) >= 2 ),
		    last_name text not null  not null check ( length(last_name) >= 2 ),
		    organizational_role_code varchar(64) not null references organizational_role(code) on delete restrict on update cascade,
		    email varchar(255) null,
		    phone varchar(64) null,
		    region_id integer not null references region(id) on delete restrict on update cascade,
		    organization_id integer null references contact_list_organization(id) on delete restrict on update cascade
		);

		create table wildlife_health_id (
				id serial not null primary key,
				year_id integer not null references year(id) on delete restrict on update cascade
		);

		create type wildlife_health_id_status as enum ('UNASSIGNED', 'ASSIGNED', 'RETIRED');

		create table wildlife_health_id_status_history (
				id serial not null primary key,
				wildlife_health_id integer not null references wildlife_health_id(id) on delete cascade on update cascade,
				supersedes integer null references wildlife_health_id_status_history(id) on delete restrict on update restrict,
				status wildlife_health_id_status not null default 'UNASSIGNED',
				reason text not null check( length (reason) >= 5 )
		);

		create table wildlife_health_id_retirement_details (
				id serial not null primary key,
				status_history_id integer not null references wildlife_health_id_status_history(id) on delete cascade on update cascade,
				sample_kits_returned boolean not null,
				is_recapture boolean not null,
				corrected_wlh_id integer references wildlife_health_id(id)
		);

		alter table wildlife_health_id add column last_status_id integer not null default 0 references wildlife_health_id_status_history(id) on delete restrict on update cascade;
		alter table wildlife_health_id alter column last_status_id drop default;

		create table animal_sex (
		    code CHAR(1) not null primary key,
		    name VARCHAR(16) not null unique,
		    sort_order integer not null default 0
		);

		create table animal_ear (
		    code CHAR(1) not null primary key,
		    name VARCHAR(16) not null unique,
		    sort_order integer not null default 0
		);


		create sequence animal_sex_sort_order as integer increment by 10 start with 100 owned by whis.animal_sex.sort_order;
		alter table animal_sex alter column sort_order set default nextval('animal_sex_sort_order');

		insert into animal_sex(code, name) values ('U', 'Unknown');
		insert into animal_sex(code, name) values ('M', 'Male');
		insert into animal_sex(code, name) values ('F', 'Female');

		create sequence animal_ear_sort_order as integer increment by 10 start with 100 owned by whis.animal_ear.sort_order;
		alter table animal_ear alter column sort_order set default nextval('animal_ear_sort_order');

		insert into animal_ear(code, name) values ('L', 'Left');
		insert into animal_ear(code, name) values ('R', 'Right');


		create table animal_identifier_type
		(
			code       VARCHAR(16)  not null primary key,
			name       VARCHAR(255) not null unique,
			sort_order integer      not null default 0
		);
		create sequence animal_identifier_type_sort_order as integer increment by 10 start with 100 owned by whis.animal_identifier_type.sort_order;
		alter table animal_identifier_type alter column sort_order set default nextval('animal_identifier_type_sort_order');

		insert into animal_identifier_type(code, name) values ('ANIMAL_ID', 'Alternate Animal ID');
		insert into animal_identifier_type(code, name) values ('COMPULSORY', 'Compulsory Inspection Number');
		insert into animal_identifier_type(code, name) values ('EAR_TAG', 'Ear Tag Number');
		insert into animal_identifier_type(code, name) values ('HUMAN_WILDLIFE', 'Human Wildlife Conflict Number');
		insert into animal_identifier_type(code, name) values ('COORS', 'COORS Number');
		insert into animal_identifier_type(code, name) values ('LEG_BAND', 'Leg Band');
		insert into animal_identifier_type(code, name) values ('MICROCHIP', 'Microchip');
		insert into animal_identifier_type(code, name) values ('NICKNAME', 'Nickname');
		insert into animal_identifier_type(code, name) values ('PIT_TAG', 'Pit Tag');
		insert into animal_identifier_type(code, name) values ('RAPP_TAG', 'RAPP Ear Tag');
		insert into animal_identifier_type(code, name) values ('RECAPTURE_ID', 'Recapture ID');
		insert into animal_identifier_type(code, name) values ('CWD', 'CWD Ear Card');
		insert into animal_identifier_type(code, name) values ('VAGINAL', 'Vaginal Implant Transmitter');
		insert into animal_identifier_type(code, name) values ('WING_BAND', 'Wing Band');
		insert into animal_identifier_type(code, name) values ('COLLAR_ID', 'Collar ID');

		create type species_retrieval_record_UNCHECKED as
		(
			code            varchar(64),
			unit_name1      varchar(255),
			unit_name2      varchar(255),
			unit_name3      varchar(255),
			taxon_authority varchar(255),
			tty_kingdom     varchar(255),
			tty_name        varchar(255),
			english_name    varchar(512),
			note            text,
			retrieved_at    timestamp without time zone
		);

		create domain species_retrieval_record as species_retrieval_record_UNCHECKED check (
				(value).code is not null and
				(value).english_name is not null and
				(value).retrieved_at is not null
			);

		alter table wildlife_health_id add column region_id integer null references region (id) on delete restrict on update cascade;
		alter table wildlife_health_id add column	animal_sex_code char(1) null references animal_sex (code) on delete restrict on update cascade;
		alter table wildlife_health_id add column species species_retrieval_record  null;
		alter table wildlife_health_id alter column species set not null;


	`);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
