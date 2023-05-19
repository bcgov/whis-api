async function up(knex) {
	await knex.raw(`
		set search_path to whis, public;

		create table animal_identifier (
		    id serial not null primary key,
		    identifier_type_code varchar(16) references animal_identifier_type(code) on update cascade on delete restrict,
		    identifier varchar(255) not null,
		    wildlife_health_id integer not null references wildlife_health_id(id) on update cascade on delete cascade,
				constraint unique_type_id unique (wildlife_health_id, identifier_type_code)
		);

		create table animal_identifier_detail_ear_tag (
		    id integer not null primary key references animal_identifier(id) on update cascade on delete restrict,
		    ear char(1) not null references animal_ear(code) on update cascade on delete restrict,
		    colour varchar(64) not null
		);

		create table animal_identifier_detail_rapp_ear_tag (
		    id integer not null primary key references animal_identifier(id) on update cascade on delete restrict,
		    ear char(1) not null references animal_ear(code) on update cascade on delete restrict
   	);

		create table purpose (
		    code VARCHAR(32) not null primary key,
		    name VARCHAR(255) not null unique,
		    sort_order integer not null default 0
		);

		create sequence purpose_sort_order as integer increment by 10 start with 100 owned by purpose.sort_order;
		alter table purpose alter column sort_order set default nextval('purpose_sort_order');

		insert into purpose(code, name) values ('HERD_HEALTH', 'Herd Health');
		insert into purpose(code, name) values ('TARGETED', 'Targeted Surveillance');
		insert into purpose(code, name) values ('PASSIVE', 'Passive Surveillance');
		insert into purpose(code, name) values ('UNKNOWN', 'Unknown');

		alter table wildlife_health_id add column primary_purpose varchar(32) references purpose(code) on update cascade on delete restrict;
		alter table wildlife_health_id alter column primary_purpose set not null;

		alter table wildlife_health_id add column secondary_purpose varchar(32) null references purpose(code) on update cascade on delete restrict;

		alter table wildlife_health_id add column associated_project text null;
		alter table wildlife_health_id add column associated_project_details text null;

		--

		create table animal_age_class (
		    code VARCHAR(32) not null primary key,
		    name VARCHAR(255) not null unique,
		    sort_order integer not null default 0
		);

		create sequence animal_age_class_sort_order as integer increment by 10 start with 100 owned by animal_age_class.sort_order;
		alter table animal_age_class alter column sort_order set default nextval('animal_age_class_sort_order');

		insert into animal_age_class(code, name) values ('ADULT', 'Adult');
		insert into animal_age_class(code, name) values ('AGED_ADULT', 'Aged Adult');
		insert into animal_age_class(code, name) values ('JUVENILE', 'Juvenile');
		insert into animal_age_class(code, name) values ('UNCLASSIFIED', 'Unclassified');
		insert into animal_age_class(code, name) values ('YOUNG', 'Young of the year');

		create type event_type as enum ('CAPTURE', 'MORTALITY', 'RECAPTURE');

		create table event (
		    id serial primary key,
		    wildlife_health_id integer not null references wildlife_health_id(id) on update cascade on delete cascade,
				event_type event_type not null,
				start_date date not null,
				age_class varchar(32) references animal_age_class(code) on update cascade on delete restrict,
				samples_collected bool not null,
				samples_sent_for_testing bool not null,
				samples_results_received bool not null,
				submitter_retrieval_record_id integer null references contact_list_person_retrieval_record(id) on update cascade on delete restrict,
				history text null
		);

		create table location_type (
		    code VARCHAR(32) not null primary key,
		    name VARCHAR(255) not null unique,
		    sort_order integer not null default 0
		);

		create sequence location_type_sort_order as integer increment by 10 start with 100 owned by location_type.sort_order;
		alter table location_type alter column sort_order set default nextval('location_type_sort_order');

		insert into location_type(code, name) values ('REGION', 'Region');
		insert into location_type(code, name) values ('MANAGEMENT_UNIT', 'Management Unit');
		insert into location_type(code, name) values ('POPULATION_UNIT', 'Population Unit');
		insert into location_type(code, name) values ('HERD_NAME', 'Herd Name');
		insert into location_type(code, name) values ('COORDINATES', 'Latitude/ Longitude (in decimal degrees)');
		insert into location_type(code, name) values ('UTM_COORDINATES', 'UTM Coordinates');
		insert into location_type(code, name) values ('CITY', 'City');
		insert into location_type(code, name) values ('CIVIC_ADDRESS', 'Civic Address');


		create table management_unit (
		    id serial primary key,
		    name VARCHAR(255) not null unique,
		    effective date not null default current_date,
		    expires date null,
		    sort_order integer not null default 0
		);

		create sequence management_unit_sort_order as integer increment by 10 start with 100 owned by management_unit.sort_order;
		alter table management_unit alter column sort_order set default nextval('management_unit_sort_order');

		insert into management_unit(name) values ('Example Management Unit 1');
		insert into management_unit(name) values ('Example Management Unit 2');
		insert into management_unit(name) values ('Example Management Unit 3');

		create table population_unit (
		    id serial primary key,
		    name VARCHAR(255) not null unique,
		    effective date not null default current_date,
		    expires date null,
		    sort_order integer not null default 0
		);

		create sequence population_unit_sort_order as integer increment by 10 start with 100 owned by population_unit.sort_order;
		alter table population_unit alter column sort_order set default nextval('population_unit_sort_order');

		insert into population_unit(name) values ('Example Population Unit 1');
		insert into population_unit(name) values ('Example Population Unit 2');
		insert into population_unit(name) values ('Example Population Unit 3');

		create table event_location (
        id serial not null primary key,
        event_id integer not null references event(id) on update cascade on delete restrict,
        location_type_code varchar(32) references location_type(code) on update cascade on delete restrict
		);

		create table event_location_details_region (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
				region_id integer not null references region(id) on update cascade on delete restrict
		);

		create table event_location_details_management_unit (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
				management_unit_id integer not null references management_unit(id) on update cascade on delete restrict
		);

		create table event_location_details_population_unit (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
				population_unit_id integer not null references population_unit(id) on update cascade on delete restrict
		);

		create table event_location_details_herd_name (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
				herd_name varchar(255) not null check (length(herd_name) >= 2)
		);

		create table event_location_details_coordinates (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
				latitude numeric(8,5) not null,
				longitude numeric(8,5) not null
		);

		create table event_location_details_utm_coordinates (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
      	zone integer not null,
				northing numeric(10,2) not null,
				easting numeric(10,2) not null
		);

		create table event_location_details_city (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
      	city varchar(512) not null
		);

		create table event_location_details_civic_address (
      	event_location_id integer not null primary key references event_location(id) on update cascade on delete restrict,
      	city varchar(512) not null,
      	address text not null
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
