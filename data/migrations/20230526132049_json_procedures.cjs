async function up(knex) {
	await knex.raw(`
    set search_path to whis, public;

		create or replace view whis_json_species_retrieval_record as
		select s.id as id, json_build_object(
		               'id', s.id,
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

		create or replace view whis_json_region as
		    select r.id as id, json_build_object(
						'id', r.id,
		        'name', r.name
		    ) as json from region r;


		create or replace view whis_json_population_unit as
		    select p.id as id, json_build_object(
						'id', p.id,
		        'name', p.name
		    ) as json from population_unit p;

		create or replace view whis_json_management_unit as
		    select m.id as id, json_build_object(
						'id', m.id,
		        'name', m.name
		    ) as json from management_unit m;

		create or replace view whis_json_organizational_role as
		    select r.code as code, json_build_object(
						'code', r.code,
		        'name', r.name
		    ) as json from organizational_role r;

		create or replace view whis_json_contact_list_organization as
		    select o.id as id, json_build_object(
						'id', o.id,
		        'name', o.name
		    ) as json from contact_list_organization o;

		create or replace view whis_json_contact_list_person as
		    select c.id as id,
         json_build_object(
						'id', c.id,
		        'email', c.email,
		        'firstName', c.first_name,
		        'lastName', c.last_name,
		        'phone', c.phone,
		        'organization', (select json from whis_json_contact_list_organization where id = c.organization_id),
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
		        'organizationalRole', c.organizational_role_name,
		        'retrievedAt', c.retrieved_at,
		        'contactListEntry', (select json from whis_json_contact_list_person where id = c.contact_list_person_id)
		    ) as json  from contact_list_person_retrieval_record c;

		create or replace view whis_json_year as
		    select y.id as id, json_build_object(
						'id', y.id,
		        'shortName', y.short_name,
		        'name', y.name
		    ) as json from year y;

		create or replace view whis_json_animal_identifier as
		select i.id                 as id,
		       i.wildlife_health_id as wildlife_health_id,
		       case
		           when i.identifier_type_code = 'EAR_TAG' then
		               json_build_object(
		                       'id', i.id,
		                       'type', i.identifier_type_code,
		                       'identifier', i.identifier,
		                       'earCode', (select et.ear from animal_identifier_detail_ear_tag et where et.id = i.id),
		                       'colour', (select et.colour from animal_identifier_detail_ear_tag et where et.id = i.id)
		                   )
		           when i.identifier_type_code = 'RAPP_TAG' then
		               json_build_object(
		                       'id', i.id,
		                       'type', i.identifier_type_code,
		                       'identifier', i.identifier,
		                       'earCode', (select rt.ear from animal_identifier_detail_rapp_ear_tag rt where rt.id = i.id)
		                   )
		           else json_build_object(
		                   'id', i.id,
		                   'type', i.identifier_type_code,
		                   'identifier', i.identifier
		               )
		           end                 json
		from animal_identifier i;

		create or replace view whis_json_event_location as
		select e.id       as id,
		       e.event_id as event_id,
		       e.location_type_code as location_type_code,
		       case
		           when e.location_type_code = 'REGION' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'region', (select json
		                                  from whis_json_region
		                                  where id = (select region_id
		                                              from event_location_details_region
		                                              where event_location_id = e.id))
		                   )
		           when e.location_type_code = 'MANAGEMENT_UNIT' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'managementUnit', (select json
		                                          from whis_json_management_unit
		                                          where id = (select management_unit_id
		                                                      from event_location_details_management_unit
		                                                      where event_location_id = e.id))
		                   )
		           when e.location_type_code = 'POPULATION_UNIT' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'populationUnit', (select json
		                                          from whis_json_population_unit
		                                          where id = (select population_unit_id
		                                                      from event_location_details_population_unit
		                                                      where event_location_id = e.id))
		                   )
		           when e.location_type_code = 'HERD_NAME' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'herdName',
		                       (select herd_name from event_location_details_herd_name where event_location_id = e.id)
		                   )
		           when e.location_type_code = 'COORDINATES' then
		               json_build_object('id', e.id,
		                                 'type', e.location_type_code,
		                                 'latitude', (select latitude
		                                              from event_location_details_coordinates
		                                              where event_location_id = e.id),
		                                 'longitude', (select longitude
		                                               from event_location_details_coordinates
		                                               where event_location_id = e.id)
		                   )
		           when e.location_type_code = 'UTM_COORDINATES' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'zone',
		                       (select "zone" from event_location_details_utm_coordinates where event_location_id = e.id),
		                       'northing',
		                       (select northing from event_location_details_utm_coordinates where event_location_id = e.id),
		                       'easting',
		                       (select easting from event_location_details_utm_coordinates where event_location_id = e.id)
		                   )
		           when e.location_type_code = 'CITY' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'city', (select city from event_location_details_city where event_location_id = e.id)
		                   )
		           when e.location_type_code = 'CIVIC_ADDRESS' then
		               json_build_object(
		                       'id', e.id,
		                       'type', e.location_type_code,
		                       'city', (select city from event_location_details_civic_address where event_location_id = e.id),
		                       'address',
		                       (select address from event_location_details_civic_address where event_location_id = e.id)
		                   )
		           end       json
		from event_location e;

		create or replace view whis_json_age_class as
    select a.code as code, json_build_object(
        'code', a.code,
        'name', a.name
        ) as json  from animal_age_class a;



		create or replace view whis_json_purpose as
    select a.code as code, json_build_object(
        'code', a.code,
        'name', a.name
        ) as json  from purpose a;


		create or replace view whis_json_animal_sex as
    select a.code as code, json_build_object(
        'code', a.code,
        'name', a.name
        ) as json  from animal_sex a;

		create or replace view whis_json_event as
		select e.id                                                            as id,
		       e.wildlife_health_id                                            as wildlife_health_id,
		       e.start_date as start_date,
		       json_build_object('id', e.id,
		                         'type', e.event_type,
		                         'startDate', e.start_date,
		                         'samples', json_build_object(
		                                 'collected', e.samples_collected,
		                                 'sentForTesting', e.samples_sent_for_testing,
		                                 'resultsReceived', e.samples_results_received
		                             ),
		                         'ageClass', (select json from whis_json_age_class where code = e.age_class),
		                         'history', e.history,
		                         'locations', (select coalesce(json_agg(json order by l.location_type_code), '[]'::json)
		                                       from whis_json_event_location l
		                                       where l.event_id = e.id),
		                         'submitter',
		                         (select json
		                          from whis_json_contact_list_person_retrieval_record
		                          where id = e.submitter_retrieval_record_id)) as json
		from "event" e;

		create view whis_json_status_history as
		WITH RECURSIVE cte as (select w.supersedes,
		                              w.id,
		                              w.wildlife_health_id,
		                              w.reason,
		                              w.status_change_date,
		                              w.status
		                       from wildlife_health_id_status_history w
		                       where w.supersedes is null
		                       union all
		                       select t.supersedes,
		                              t.id,
		                              t.wildlife_health_id,
		                              t.reason,
		                              t.status_change_date,
		                              t.status
		                       from wildlife_health_id_status_history t
		                                inner join cte c on t.supersedes = c.id)
		select cte.wildlife_health_id as wildlife_health_id,
		       json_agg(
		               case
		                   when cte.status = 'RETIRED' then
		                       json_build_object(
		                               'status', cte.status,
		                               'reason', cte.reason,
		                           	   'statusChangeDate', cte.status_change_date,
		                               'id', cte.id,
		                               'isRecapture', (select is_recapture
		                                               from wildlife_health_id_retirement_details
		                                               where status_history_id = cte.id),
		                               'sampleKitsReturned', (select sample_kits_returned
		                                                      from wildlife_health_id_retirement_details
		                                                      where status_history_id = cte.id),
		                               'correctedWildlifeHealthID', (select corrected_wlh_id
		                                                             from wildlife_health_id_retirement_details
		                                                             where status_history_id = cte.id)
		                           )
		                   else
		                       json_build_object(
		                               'status', cte.status,
		                               'reason', cte.reason,
                                   'statusChangeDate', cte.status_change_date,
		                               'id', cte.id
		                           )
		                   end
		           ) as json
		from cte
		group by cte.wildlife_health_id;

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
		                         'identifiers',
		                         (select coalesce(json_agg(json), '[]'::json) from whis_json_animal_identifier where wildlife_health_id = i.id),
		                         'events',
		                         (select coalesce(json_agg(json order by start_date), '[]'::json)
		                          from whis_json_event
		                          where wildlife_health_id = i.id),
		                         'requester', (select json
		                                       from whis_json_contact_list_person_retrieval_record
		                                       where id = i.requester_retrieval_record_id)) as json
		from wildlife_health_id i;

  `);
}

async function down(knex) {
	await knex.raw(`
    set search_path to whis, public;

		drop view if exists whis_json_species_retrieval_record cascade;
		drop view if exists whis_json_region cascade;
		drop view if exists whis_json_population_unit cascade;
		drop view if exists whis_json_management_unit cascade;
		drop view if exists whis_json_organizational_role cascade;
		drop view if exists whis_json_contact_list_organization cascade;
		drop view if exists whis_json_contact_list_person cascade;
		drop view if exists whis_json_contact_list_person_retrieval_record cascade;
		drop view if exists whis_json_year cascade;
		drop view if exists whis_json_animal_identifier cascade;
		drop view if exists whis_json_event_location cascade;
		drop view if exists whis_json_age_class cascade;
		drop view if exists whis_json_purpose cascade;
		drop view if exists whis_json_animal_sex cascade;
		drop view if exists whis_json_event cascade;
		drop view if exists whis_json_status_history cascade;
		drop view if exists whis_json_wildlife_health_id cascade;
`);
}

module.exports = {
	down,
	up
};
