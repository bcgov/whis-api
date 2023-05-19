async function up(knex) {
	await knex.raw(`
		set search_path to whis, public;

		CREATE TABLE year
		(
			id                  integer not null PRIMARY KEY,
			name                VARCHAR(255) NOT NULL UNIQUE,
			short_name          VARCHAR(8)   NOT NULL UNIQUE,
			starts              DATE         NOT NULL,
			ends                DATE         NOT NULL,
			high_water_mark     INTEGER NOT NULL DEFAULT 0
		);

		-- create years 2020 through 2099
		insert into year(id, name, short_name, starts, ends) select sq.year as id,
		        sq.year::text as name,
		        (sq.year-2000)::text as short_name,
		        make_date(sq.year, 1,1 ) as starts,
		        make_date(sq.year, 12, 31) as ends
		from (select generate_series(2020, 2099) as year) as sq;
`);

	await knex.raw(`
		set search_path to whis, public;

		CREATE TABLE generation_record
		(
			id         SERIAL PRIMARY KEY,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			application_user_id    INTEGER  NOT NULL REFERENCES application_user(id) ON DELETE RESTRICT
		);

		create type wildlife_health_id_status as enum ('UNASSIGNED', 'ASSIGNED', 'RETIRED');

		create table wildlife_health_id (
				id serial not null primary key,
				year_id integer not null references year(id) on delete restrict on update restrict,
				id_number integer not null,
				current_status wildlife_health_id_status not null default 'UNASSIGNED',
				generation_record_id integer null references generation_record(id) on update cascade on delete restrict,
				flagged bool not null default false,
				updated_after_creation bool not null default false,
				CONSTRAINT unique_year_number UNIQUE (year_id, id_number)
		);
`);

	await knex.raw(`
		set search_path to whis, public;

		create OR REPLACE FUNCTION wildlife_health_id_immutable_fields()
				RETURNS TRIGGER
				LANGUAGE PLPGSQL
		AS
		$$
		BEGIN
				IF NEW.ID_NUMBER <> OLD.ID_NUMBER THEN
					RAISE EXCEPTION 'id_number is immutable';
				END IF;

				IF NEW.YEAR_ID <> OLD.YEAR_ID THEN
					RAISE EXCEPTION 'year_id is immutable';
				END IF;

				RETURN NEW;
		END
		$$;

		CREATE TRIGGER wildlife_health_id_immutable_fields_trigger
				before update
				on wildlife_health_id
				FOR each row
		execute procedure wildlife_health_id_immutable_fields();

`);

	await knex.raw(`
		set search_path to whis, public;

		create table generation_lock
		(
			id       BIGSERIAL PRIMARY KEY,
			email    VARCHAR(255)             NOT NULL,
			acquired timestamp without time zone not null default current_timestamp,
			expires  timestamp without time zone not null default current_timestamp + interval '3 minutes',
			released boolean                  not null default false,
			CONSTRAINT overlapping_expiry_times EXCLUDE USING GIST (tsrange(acquired, expires) WITH && ) where (not released)
		);

		create view generation_lock_holder AS
		(select id, email, acquired, expires from generation_lock where (not released) and (tstzrange(acquired, expires) @> current_timestamp));

		create OR REPLACE FUNCTION update_year_sequence_triggerfunc()
				RETURNS TRIGGER
				LANGUAGE PLPGSQL
		AS
		$$
		BEGIN
				UPDATE year set high_water_mark = new.id_number where year.id = new.year_id;
				RETURN NEW;
		END
		$$;

		CREATE TRIGGER update_year_sequence
				AFTER insert
				on wildlife_health_id
				FOR each row
		execute procedure update_year_sequence_triggerfunc();

  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
