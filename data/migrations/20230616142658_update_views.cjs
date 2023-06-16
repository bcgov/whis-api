async function up(knex) {
	await knex.raw(`
    set search_path to whis, public;

		alter table species_retrieval_record add column taxonomy_id integer not null default 0;

		create or replace view whis_json_species_retrieval_record as
		select s.id as id, json_build_object(
		               'id', s.id,
		    					 'taxonomyId', s.taxonomy_id,
		               'code', s.code,
		               'unitName1', s.unit_name1,
		               'unitName2', s.unit_name2,
		               'unitName3', s.unit_name3,
		               'taxonAuthority', s.taxon_authority,
		               'ttyKingdom', s.tty_kingdom,
		               'ttyName', s.tty_name,
		               'englishName', s.english_name,
		               'note', s.note) as json
		from species_retrieval_record s;

		alter table wildlife_health_id alter column generation_record_id set not null;

		create or replace view whis_json_wildlife_health_id as
		select i.id                                                                         as id,
		       json_build_object('id', i.id,
		                         'species',
		                         (select json from whis_json_species_retrieval_record where id = i.species_retrieval_record_id),
		                         'wildlifeHealthId', i.computed_wildlife_id,
		                         'idNumber', i.id_number,
		                         'flagged', i.flagged,
		                         'region', (select json from whis_json_region where id = i.region_id),
		                         'animalSex', (select json from whis_json_animal_sex where code = i.animal_sex_code),
		                         'primaryPurpose', (select json from whis_json_purpose where code = i.primary_purpose),
		                         'secondaryPurpose', (select json from whis_json_purpose where code = i.secondary_purpose),
		                         'associatedProject', i.associated_project,
		                         'associatedProjectDetails', i.associated_project_details,
		                         'year', (select json from whis_json_year where id = i.year_id),
		                         'status', i.current_status,
		           							 'statusHistory', (select json from whis_json_status_history where wildlife_health_id = i.id),
                             'creationDate', gr.created_at,
		                         'identifiers',
		                         (select coalesce(json_agg(json), '[]'::json) from whis_json_animal_identifier where wildlife_health_id = i.id),
		                         'events', (select coalesce(json_agg(json order by start_date), '[]'::json)
		                          from whis_json_event
		                          where wildlife_health_id = i.id),
		                         'requester', (select json
		                                       from whis_json_contact_list_person_retrieval_record
		                                       where id = i.requester_retrieval_record_id)) as json
		from wildlife_health_id i
			left join generation_record gr on i.generation_record_id = gr.id;

  `);
}

async function down(knex) {
	await knex.raw(`
    set search_path to whis, public;
  `);
}

module.exports = {
	down,
	up
};
