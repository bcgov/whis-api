async function up(knex) {
	await knex.raw(`
    set search_path to whis,public;

		alter table wildlife_health_id add column computed_wildlife_id varchar(16) null;

		CREATE OR REPLACE FUNCTION compute_wildlife_health_id()
		RETURNS trigger
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    NEW.computed_wildlife_id = (select y.short_name from year y where y.id = new.year_id) || '-'
           || (select case when length(new.id_number::text) < 4 then lpad(new.id_number::text, 4, '0') else new.id_number::text end);

		    RETURN NEW;
		END
		$$;

		CREATE TRIGGER compute_wildlife_health_id
		BEFORE INSERT OR UPDATE
		ON wildlife_health_id
		FOR EACH ROW
		EXECUTE PROCEDURE compute_wildlife_health_id();

		update wildlife_health_id set id_number = id_number; -- force trigger exec

		alter table wildlife_health_id alter column computed_wildlife_id set not null;
  `);
}

async function down(knex) {
	await knex.raw(`
    set search_path to whis,public;
    alter table wildlife_health_id drop column computed_wildlife_id;
		drop function compute_wildlife_health_id();
		drop trigger compute_wildlife_health_id on wildlife_health_id;
	`);
}

module.exports = {
	down,
	up
};
