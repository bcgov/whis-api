async function up(knex) {
	await knex.raw(`
		set search_path to whis, public;

		create table region (
	    id serial primary key,
		  name varchar(255) not null,
		  effective date not null default CURRENT_DATE,
		  expires date null,
		  sort_order integer not null default 0
		);

		create sequence region_sort_order as integer increment by 10 start with 100 owned by region.sort_order;
		alter table region alter column sort_order set default nextval('region_sort_order');

		insert into region(name) values ('Vancouver Island');
		insert into region(name) values ('Lower Mainland');
		insert into region(name) values ('Thompson');
		insert into region(name) values ('Kootenay');
		insert into region(name) values ('Cariboo');
		insert into region(name) values ('Skeena');
		insert into region(name) values ('Omineca');
		insert into region(name) values ('Okanagan');
		insert into region(name) values ('Peace');

		create table contact_list_organization (
		    id serial not null primary key,
				name varchar(512) not null check ( length(name) >= 2 )
		);

		create table organizational_role (
		    code varchar(64) not null primary key,
		    name varchar(255) not null unique check ( length (name) >= 2 ),
		    sort_order integer not null default 0
		);

		create sequence organizational_role_sort_order as integer increment by 10 start with 100 owned by whis.organizational_role.sort_order;
		alter table organizational_role alter column sort_order set default nextval('organizational_role_sort_order');

		insert into organizational_role(code, name) values ('CONSERVATION_OFFICER', 'Conservation Officer');
		insert into organizational_role(code, name) values ('CONTRACTOR', 'Contractor');
		insert into organizational_role(code, name) values ('COMPULSORY_INSPECTOR', 'Compulsory Inspector');
		insert into organizational_role(code, name) values ('FIRST_NATION', 'First Nation');
		insert into organizational_role(code, name) values ('GOVERNMENT_BIOLOGIST', 'Government Biologist');
		insert into organizational_role(code, name) values ('HIGHWAY_CREW', 'Highway Crew');
		insert into organizational_role(code, name) values ('HUNTER', 'Hunter');
		insert into organizational_role(code, name) values ('PUBLIC', 'Public');
		insert into organizational_role(code, name) values ('TRAPPER', 'Trapper');

		create table contact_list_person (
		    id serial not null primary key,
				first_name text not null not null check ( length(first_name) >= 2 ),
		    last_name text not null not null check ( length(last_name) >= 2 ),
		    organizational_role_code varchar(64) not null references organizational_role(code) on delete restrict on update cascade,
		    email varchar(255) null,
		    phone varchar(64) null,
		    region_id integer not null references region(id) on delete restrict on update cascade,
		    organization_id integer null references contact_list_organization(id) on delete restrict on update cascade
		);

		create table contact_list_person_retrieval_record (
		    id serial not null primary key,
		    contact_list_person_id integer not null references contact_list_person on update cascade on delete restrict,
				first_name text not null,
		    last_name text not null,
		    organizational_role_name varchar(255) not null,
		    email varchar(255) null,
		    phone varchar(64) null,
		    region_name varchar(255) not null,
		    organization_name varchar(512) null,
		    retrieved_at timestamp without time zone not null default current_timestamp
		);

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
				                                                 retrieved_at)
				select c.id, c.first_name, c.last_name, o.name, c.email, c.phone, region.name, org.name, current_timestamp
				from contact_list_person c
				    left outer join organizational_role o on c.organizational_role_code = o.code
		    		left outer join region on region.id = c.region_id
		    		left outer join contact_list_organization org on c.organization_id = org.id
				    where c.id = $1
				returning id into created_id;

				if created_id is null then raise exception 'Could not create record'; end if;

				return created_id;
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
