async function up(knex) {
	await knex.raw(`
    set search_path to whis,public;

		comment on table animal_age_class is 'Code table. The age of an animal at the time an event occurred';
		comment on column animal_age_class.name is 'English name for presentation. eg. Adult';
		comment on column animal_age_class.code is 'Natural key, should be chosen to be memorable (eg ADULT)';
		comment on column animal_age_class.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table animal_ear is 'Code table. Which ear bears a tag.';
		comment on column animal_ear.code is 'Natural key. eg L';
		comment on column animal_ear.name is 'Enlugh name for presentation. eg Left';
		comment on column animal_ear.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table animal_identifier is 'Each health id can have multiple ways of identifying an individual animal. This tracks the types of identifiers for each id.';
		comment on column animal_identifier.identifier_type_code is 'FK to code table containing acceptable types of identifiers';
		comment on column animal_identifier.identifier is 'A string specific to this identifier type, eg a tag ID number, nickname, or descriptive text';

		comment on table animal_identifier_detail_ear_tag is 'When the animal identifier is an ear tag, additional attributes are required';
		comment on column animal_identifier_detail_ear_tag.ear is 'FK to code table. Which ear is the tag in?';
		comment on column animal_identifier_detail_ear_tag.colour is 'Description of the colour of the ear tag';

		comment on table animal_identifier_detail_rapp_ear_tag is 'When the animal identifier is a RAPP ear tag, additional attributes are required';
		comment on column animal_identifier_detail_rapp_ear_tag.ear is 'FK to code table. Which ear is the tag in?';

		comment on table animal_identifier_type is 'Code table. Types of identifiers animals may have. Modifying contents will require frontend code adjustments.';
		comment on column animal_identifier_type.code is 'Natural key. eg EAR_TAG';
		comment on column animal_identifier_type.name is 'English name for presentation. Eg. "Ear Tag"';
		comment on column animal_identifier_type.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table animal_sex is 'Code table. Representing the sex of an animal tracked by a health ID';
		comment on column animal_sex.code is 'Natural key. eg, M or U';
		comment on column animal_sex.name is 'English name for presentation. Eg. Unknown';
		comment on column animal_sex.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table application_access_request is 'Users with no role are offered the opportunity to request access on login. Track these requests. This table is not used as part of authentication or authorization -- users will be added to the application_user table if the request is actioned';
		comment on column application_access_request.email is 'Email. Presented to authorizing user for verification. Taken from authentication token.';
		comment on column application_access_request.reason is 'Freeform text. Users may describe why they required access.';
		comment on column application_access_request.status is 'Enum. The status (eg PENDING, ACTIONED, or DECLINED) of this request.';

		comment on table application_user is 'Binds a user (authenticated by SSO/JWT) to an identity and role within the application.';
		comment on column application_user.email is 'Saved from the JWT and retained for presentation to other users.';

		comment on table contact_list_organization is 'Maintains a list of organizations that interact with wildlife health ids.';
		comment on column contact_list_organization.name is 'Unique name of the organization';

		comment on table contact_list_person is 'Maintains a list of people (who may or may not be application users) who can be referenced as requesters of health ids or submitters of events on those ids. Mutable.';
		comment on column contact_list_person.email is 'Email for this person.';
		comment on column contact_list_person.first_name is 'Name';
		comment on column contact_list_person.last_name is 'Name';
		comment on column contact_list_person.organization_id is 'FK. The organization with which this person is associated.';
		comment on column contact_list_person.organizational_role_code is 'FK. The role (eg RESEARCHER) that this person currently holds.';
		comment on column contact_list_person.phone is 'Phone number';

		comment on table contact_list_person_retrieval_record is 'A copy of a contact_list_person stored at a particular point in time (and associated with requesting IDs or submitting events at that particular time). Should be treated as immutable.';
		comment on column contact_list_person_retrieval_record.contact_list_person_id is 'FK. The (possibly edited) contact list entry this was duplicated from.';
		comment on column contact_list_person_retrieval_record.retrieved_at is 'When the copy was made.';

		comment on table event is 'An unordered collection of events associated with a wildlife health ID';
		comment on column event.wildlife_health_id is 'FK. The relevant health ID.';
		comment on column event.history is 'Freeform text. A description of the circumstances of the event.';
		comment on column event.age_class is 'FK to code table. Age of the animal at the time of the event';
		comment on column event.samples_results_received is 'Flag. Used to track sample testing.';
		comment on column event.samples_sent_for_testing is 'Flag. Used to track sample testing.';
		comment on column event.samples_collected is 'Flag. Used to track sample testing.';
		comment on column event.event_type is 'Enum. eg CAPTURE, MORTALITY.';
		comment on column event.start_date is 'When the event began. The end date is not tracked.';
		comment on column event.submitter_retrieval_record_id is 'FK to a row created on event save. Represents the contact list person entry saved at the time of event recording.';

		comment on type event_type is 'Available event types. Adjustments will require code modification.';

		comment on table event_location is 'Events can occur at zero or more locations.';
		comment on column event_location.location_type_code is 'FK to code table';

		comment on table event_location_details_city is 'Attributes for event location when the type is "CITY"';
		comment on table event_location_details_civic_address is 'Attributes for event location when the type is "CIVIC_ADDRESS"';
		comment on table event_location_details_coordinates is 'Attributes for event location when the type is "COORDINATES". Lat/Lon coordinates';
		comment on table event_location_details_herd_name is 'Attributes for event location when the type is "HERD_NAME"';
		comment on table event_location_details_management_unit is 'Attributes for event location when the type is "MANAGEMENT_UNIT"';
		comment on column event_location_details_management_unit.management_unit_id is 'FK to list of management units';

		comment on table event_location_details_population_unit is 'Attributes for event location when the type is "POPULATION_UNIT"';
		comment on column event_location_details_population_unit.population_unit_id is 'FK to list of population units';

		comment on table event_location_details_region is 'Attributes for event location when the type is "REGION"';
		comment on column event_location_details_region.region_id is 'FK to regions list';

		comment on table event_location_details_utm_coordinates is 'Attributes for event location when the type is "UTM_COORDINATES"';

		comment on table generation_lock is 'Users may exclusively lock access to the "Generate IDs" page of the application. This table tracks which user currently holds the lock and prevents duplicate locking. A constraint prevents two overlapping unreleased locks';
		comment on column generation_lock.email is 'Retained for presentation to other users (so they can view the current lockholder)';
		comment on column generation_lock.acquired is 'Time at which this lock was acquired.';
		comment on column generation_lock.expires is 'Time at which this lock will be considered stale if not released. Can be extended by an active session.';
		comment on column generation_lock.released is 'True if the lock was explicitly released.';

		comment on table generation_record is 'Holds the record of Health IDs being generated (Since they may be generated in a batch)';
		comment on column generation_record.application_user_id is 'The generating user.';
		comment on column generation_record.created_at is 'The time at which the IDs were generated';

		comment on table location_type is 'Code table. Represents possible types of location.';
		comment on column location_type.name is 'English name for presentation. Eg. Region';
		comment on column location_type.code is 'Natural key. eg REGION';
		comment on column location_type.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table management_unit is 'Code table. User-maintainable. Used to track event locations.';
		comment on column management_unit.name is 'English name for presentation. Eg. Unit 1.';
		comment on column management_unit.sort_order is 'permit custom (non-alphabetic) sorting for display';
		comment on column management_unit.expires is 'Will no longer be selectable on new records after expiry. NULL means valid indefinitely.';
		comment on column management_unit.effective is 'Will not be selectable before effective date. NULL is effective since the beginning of time.';

		comment on table organizational_role is 'Code table. The role a person interacting with Health IDs assumes in an organization that interacts with Health IDs';
		comment on column organizational_role.sort_order is 'permit custom (non-alphabetic) sorting for display';
		comment on column organizational_role.code is 'Natural key. eg HUNTER';
		comment on column organizational_role.name is 'Enlgish name for presentation. Eg Hunter.';

		comment on table population_unit is 'Code table. User-maintainable. Used to track event locations.';
		comment on column population_unit.name is 'English name for presentation. Eg. Unit 1.';
		comment on column population_unit.sort_order is 'permit custom (non-alphabetic) sorting for display';
		comment on column population_unit.expires is 'Will no longer be selectable on new records after expiry. NULL means valid indefinitely.';
		comment on column population_unit.effective is 'Will not be selectable before effective date. NULL is effective since the beginning of time.';

		comment on table purpose is 'Code table. The purposes for which a Health ID may be requested.';
		comment on column purpose.code is 'Natural key. eg. PASSIVE_SURVEILLANCE';
		comment on column purpose.name is 'English name for presentaiton. eg. "Passive Surveillance"';
		comment on column purpose.sort_order is 'permit custom (non-alphabetic) sorting for display';

		comment on table region is 'Code table. User-maintainable. Used to track event locations. Each animal may have a home region.';
		comment on column region.name is 'English name. eg Vancouver Island.';
		comment on column region.sort_order is 'permit custom (non-alphabetic) sorting for display';
		comment on column region.expires is 'Will no longer be selectable on new records after expiry. NULL means valid indefinitely.';
		comment on column region.effective is  'Will not be selectable before effective date. NULL is effective since the beginning of time.';

		comment on table species_retrieval_record is 'Species classification comes from an external service, the BioHub Taxonomy API. This table tracks the record of species details at a point in time (the point when the species is selected for a health ID). It is retained in case of connectivity disruption, or in case the original is modified. It is also used in local search indexing.';
		comment on column species_retrieval_record.code is 'A short, unique code treated as the primary key in the taxonomy API system.';
		comment on column species_retrieval_record.retrieved_at is 'The time at which the record was retrieved.';
		comment on column species_retrieval_record.tty_name is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.tty_kingdom is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.unit_name1 is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.unit_name2 is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.unit_name3 is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.note is 'Copied verbatim from taxonomy API response.';
		comment on column species_retrieval_record.english_name is 'Copied verbatim from taxonomy API response.';

		comment on table wildlife_health_id is 'Each row represents a single wildlife health ID. This is the most important table.';
		comment on column wildlife_health_id.year_id is 'FK to the year for which this ID was created. Immutable.';
		comment on column wildlife_health_id.current_status is 'Enum. The current status of this identifier (eg Assigned, Retired). Can vary.';
		comment on column wildlife_health_id.id_number is 'Sequential ID number, unique within each year. Immutable.';
		comment on column wildlife_health_id.generation_record_id is 'FK to generation record tracking the creation of this ID';
		comment on column wildlife_health_id.flagged is 'Can be toggled to highlight an ID for followup in the application.';
		comment on column wildlife_health_id.updated_after_creation is 'Used to track if details have been added since creation (since details are not added as part of generation).';
		comment on column wildlife_health_id.region_id is 'FK. Home region of the animal, if known.';
		comment on column wildlife_health_id.animal_sex_code is 'FK. Sex of the animal.';
		comment on column wildlife_health_id.species_retrieval_record_id is 'FK to record of taxonomy API response (species code) for this animal.';
		comment on column wildlife_health_id.requester_retrieval_record_id is 'FK. Represents the person requesting the generation of this ID at the point in time the ID was requested. May or may not be the application user.';
		comment on column wildlife_health_id.primary_purpose is 'FK to code table. The primary purpose of this ID.';
		comment on column wildlife_health_id.secondary_purpose is 'FK to code table. The optional secondary purpose of this ID.';
		comment on column wildlife_health_id.associated_project is 'Free text naming a project with which this ID is associated.';
		comment on column wildlife_health_id.associated_project_details is 'Free text. Additional details about the project.';
		comment on column wildlife_health_id.computed_wildlife_id is 'Generated (by trigger). Computes an ID string based on year, id number, and possibly status for this ID. Used in presentation.';


		comment on table wildlife_health_id_status_history is 'Represents the changes in status over time of a wildlife health ID';
		comment on column wildlife_health_id_status_history.supersedes is 'The status record this supersedes. If null, it is the first status history entry. Otherwise, should be set to the previous last status entry when creating a new one. Populated by stored procedure change_wildlife_health_id_status()';
		comment on column wildlife_health_id_status_history.status is 'The new status.';
		comment on column wildlife_health_id_status_history.reason is 'Free text. Why the status has changed.';

		comment on table wildlife_health_id_retirement_details is 'When the status changes to "RETIRED", additional details are collected';
		comment on column wildlife_health_id_retirement_details.corrected_wlh_id is 'It may be that this record was retired because it was found to be a duplicate. This represents the ID it has duplicated (which may be historical/not present in this database).';
		comment on column wildlife_health_id_retirement_details.is_recapture is 'If this is a recapture of a previously identified animal';
		comment on column wildlife_health_id_retirement_details.sample_kits_returned is 'For administrative tracking of sample kits';
		comment on column wildlife_health_id_retirement_details.status_history_id is 'FK to the status change record this applies to';

		comment on table year is 'Additional metadata about health ID years.';
		comment on column year.name is 'Full name, eg 2022';
		comment on column year.short_name is 'eg 22. Used in ID name computation.';
		comment on column year.high_water_mark is 'Set manually (to avoid conflicting with manually generated IDs) or by trigger (after generating new IDs) to represent the largest id_number for a given year.';
		comment on column year.starts is 'First date considered part of this year. May be used to set a default year for ID generation.';
		comment on column year.ends is 'Last date considered part of this year. May be used to set a default year for ID generation.';

  `);
}

async function down(knex) {
	throw new Error('this is a one way trip');
}

module.exports = {
	down,
	up
};
