async function up(knex) {
	await knex.raw(`
		set search_path to whis, public;


		create table wildlife_health_id_status_history (
				id serial not null primary key,
				wildlife_health_id integer not null references wildlife_health_id(id) on delete cascade on update cascade,
				supersedes integer null references wildlife_health_id_status_history(id) on delete restrict on update restrict,
				status wildlife_health_id_status not null default 'UNASSIGNED',
				reason text not null check( length (reason) >= 5 ),
				CONSTRAINT unique_supersedes_health_id UNIQUE (supersedes, wildlife_health_id),
				updated_at timestamp without time zone not null default current_timestamp
		);

		create table wildlife_health_id_retirement_details (
				id serial not null primary key,
				status_history_id integer not null references wildlife_health_id_status_history(id) on delete cascade on update cascade,
				sample_kits_returned boolean not null,
				is_recapture boolean not null,
				corrected_wlh_id integer references wildlife_health_id(id)
		);

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

		create table species_retrieval_record (
			id serial primary key,
			code            varchar(64) not null,
			unit_name1      varchar(255),
			unit_name2      varchar(255),
			unit_name3      varchar(255),
			taxon_authority varchar(255),
			tty_kingdom     varchar(255),
			tty_name        varchar(255) not null,
			english_name    varchar(512) not null,
			note            text,
			retrieved_at    timestamp without time zone
		);

		alter table wildlife_health_id add column region_id integer null references region (id) on delete restrict on update cascade;
		alter table wildlife_health_id add column	animal_sex_code char(1) null references animal_sex (code) on delete restrict on update cascade;
		alter table wildlife_health_id add column species_retrieval_record_id integer references species_retrieval_record on update cascade on delete restrict;
		alter table wildlife_health_id alter column species_retrieval_record_id set not null;

		alter table wildlife_health_id add column requester_retrieval_record_id integer references contact_list_person_retrieval_record(id) on update cascade on delete restrict;
		alter table wildlife_health_id alter column requester_retrieval_record_id set not null;

		create OR REPLACE FUNCTION change_wildlife_health_id_status(id_to_change integer,
		 new_status wildlife_health_id_status,
	   reason text
		 )
				RETURNS VOID
				LANGUAGE PLPGSQL
		AS
		$$
    DECLARE id_to_supersede INTEGER;
    DECLARE last_status wildlife_health_id_status;
		BEGIN

				select w.current_status from wildlife_health_id w where w.id = id_to_change into last_status;
				if last_status = new_status then raise exception 'Status unchanged'; end if;

        WITH RECURSIVE cte as (
				    select w.supersedes, w.id, 1 as depth,  w.status from wildlife_health_id_status_history w
				                                        where w.wildlife_health_id = id_to_change and w.supersedes is null
				    union all
				    select t.supersedes, t.id, depth + 1, t.status from wildlife_health_id_status_history t inner join cte c on t.supersedes = c.id
				) select cte.id into id_to_supersede from cte order by depth desc limit 1;

        insert into wildlife_health_id_status_history(wildlife_health_id, supersedes, reason, status) values (
                                                   id_to_change, id_to_supersede, reason, new_status
        );

        update wildlife_health_id w set current_status = new_status where w.id = id_to_change;
		END
		$$;

		create OR REPLACE FUNCTION change_wildlife_health_id_status(id_to_change integer,
		 new_status wildlife_health_id_status,
	   reason text,
     sample_kits_returned boolean,
		 is_recapture boolean,
		 corrected_wlh_id integer
		 )
				RETURNS VOID
				LANGUAGE PLPGSQL
		AS
		$$
    DECLARE id_to_supersede INTEGER;
    DECLARE created_history_id INTEGER;
    DECLARE last_status wildlife_health_id_status;
		BEGIN

				if new_status <> 'RETIRED' then raise exception 'This function is for retiring status only'; end if;
				if corrected_wlh_id = id_to_change then raise exception 'Cannot supersede self'; end if;

				select w.current_status from wildlife_health_id w where w.id = id_to_change into last_status;
				if last_status = new_status then raise exception 'Status unchanged'; end if;

        WITH RECURSIVE cte as (
				    select w.supersedes, w.id, 1 as depth,  w.status from wildlife_health_id_status_history w
				                                        where w.wildlife_health_id = id_to_change and w.supersedes is null
				    union all
				    select t.supersedes, t.id, depth + 1, t.status from wildlife_health_id_status_history t inner join cte c on t.supersedes = c.id
				) select cte.id into id_to_supersede from cte order by depth desc limit 1;

        insert into wildlife_health_id_status_history(wildlife_health_id, supersedes, reason, status) values (
                                                   id_to_change, id_to_supersede, reason, new_status
        ) returning id into created_history_id;

        insert into wildlife_health_id_retirement_details(status_history_id, sample_kits_returned, is_recapture, corrected_wlh_id) values (created_history_id, sample_kits_returned, is_recapture, corrected_wlh_id);

        update wildlife_health_id w set current_status = new_status where w.id = id_to_change;
		END
		$$;

  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
