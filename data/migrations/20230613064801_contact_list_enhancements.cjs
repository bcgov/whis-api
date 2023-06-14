async function up(knex) {
	await knex.raw(`
    set search_path to whis, public;

		insert into organizational_role (code, name) values ('UNSPECIFIED', 'Unspecified');
		insert into region (name) values ('Unspecified');

		create table contact_list_first_nation (
			id serial primary key,
		  name varchar(255) not null unique
		);

		comment on table contact_list_first_nation is 'First Nation''s groups';
		comment on column contact_list_first_nation.name is 'Unique name of this group';

		alter table contact_list_person add column address text null;
		alter table contact_list_person add column comments text null;
		alter table contact_list_person add column first_nation_id integer null references contact_list_first_nation(id) on delete restrict on update cascade;

		comment on column contact_list_person.address is 'Freeform address/location';
		comment on column contact_list_person.comments is 'Notes';
		comment on column contact_list_person.first_nation_id is 'FK to optional First Nation''s group';

		alter table contact_list_person_retrieval_record add column address text null;
		alter table contact_list_person_retrieval_record add column comments text null;
		alter table contact_list_person_retrieval_record add column first_nation_name varchar(255) null;

		comment on column contact_list_person_retrieval_record.address is 'Freeform address/location';
		comment on column contact_list_person_retrieval_record.comments is 'Notes';
		comment on column contact_list_person_retrieval_record.first_nation_name is 'Name of associated First Nation at time of retrieval';

		create OR REPLACE FUNCTION copy_contact_list_person_into_retrieval_record(INTEGER)
				RETURNS INTEGER
				LANGUAGE PLPGSQL
		AS
		$$
    DECLARE created_id INTEGER;
		BEGIN

				INSERT INTO contact_list_person_retrieval_record(contact_list_person_id,
				                                                 first_name,
				                                                 last_name,
				                                                 organizational_role_name,
				                                                 email,
				                                                 phone,
				                                                 region_name,
				                                                 organization_name,
				                                                 address,
				                                                 comments,
				                                                 first_nation_name,
				                                                 retrieved_at)

				select c.id, c.first_name, c.last_name, o.name, c.email, c.phone, region.name, org.name, c.address, c.comments, f.name, current_timestamp
				from contact_list_person c
				    left outer join organizational_role o on c.organizational_role_code = o.code
		    		left outer join region on region.id = c.region_id
		    		left outer join contact_list_organization org on c.organization_id = org.id
						left outer join contact_list_first_nation f on o.name = f.name
				    where c.id = $1
				returning id into created_id;

				if created_id is null then raise exception 'Could not create record'; end if;

				return created_id;
		END
		$$;


		-- not all the data we have for import has a last name
		alter table contact_list_person drop constraint contact_list_person_last_name_check;

		alter table contact_list_organization add column address text null;
		alter table contact_list_organization add column email varchar(255) null;
		alter table contact_list_organization add column phone varchar(64) null;

		create or replace view whis_json_contact_list_organization as
		    select o.id as id, json_build_object(
						'id', o.id,
		        'name', o.name,
		        'phone', o.phone,
		        'email', o.email,
		        'address', o.address
		    ) as json from contact_list_organization o;

		create or replace view whis_json_contact_list_first_nation as
		    select o.id as id, json_build_object(
						'id', o.id,
		        'name', o.name
		    ) as json from contact_list_first_nation o;

		create or replace view whis_json_contact_list_person as
		    select c.id as id,
         json_build_object(
						'id', c.id,
		        'email', c.email,
		        'firstName', c.first_name,
		        'lastName', c.last_name,
		        'phone', c.phone,
            'address', c.address,
					  'comments', c.comments,
		        'organization', (select json from whis_json_contact_list_organization where id = c.organization_id),
            'firstNation', (select json from whis_json_contact_list_first_nation where id = c.first_nation_id),
		        'region', (select name from region where id = c.region_id),
		        'organizationalRole', (select name from organizational_role where code = c.organizational_role_code)
		    ) as json from contact_list_person c;

		create or replace view whis_json_contact_list_person_retrieval_record as
		   select c.id as id,
		     json_build_object(
						'id', c.id,
		        'email', c.email,
		        'firstName', c.first_name,
		        'lastName', c.last_name,
		        'phone', c.phone,
		        'organization', c.organization_name,
		        'region', c.region_name,
 					  'address', c.address,
					  'comments', c.comments,
		        'firstNation', c.first_nation_name,
		        'organizationalRole', c.organizational_role_name,
		        'retrievedAt', c.retrieved_at,
		        'contactListEntry', (select json from whis_json_contact_list_person where id = c.contact_list_person_id)
		    ) as json  from contact_list_person_retrieval_record c;


  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
