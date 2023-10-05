import {log} from '../util/log';
import {TaxonomyService} from './taxonomy_search';

export interface IGenerationRequest {
	quantity: number;
	year: number;
	purpose: string | null;
	species: number | null;
	project: string | null;
	region: number | null;
	initialStatus: string;
	projectDetail: string | null;
	requester: number | null;
}

export interface IAnimalDetailPatchData {
	animalSex: string;
	identifiers: unknown[];
	region: number | null;
	species: string | null;
}

export interface IPatchRequest {
	mode: 'STATUS' | 'DETAIL' | 'EVENTS' | 'PURPOSE';
	data: IAnimalDetailPatchData;
	updater: string;
}

async function doDetailUpdate(db, id, data) {
	// basic data
	await db.query({
		text: `update wildlife_health_id
					 set animal_sex_code = $2
					 where id = $1`,
		values: [id, data['animalSex']]
	});

	await db.query({
		text: `update wildlife_health_id
					 set region_id = $2
					 where id = $1`,
		values: [id, data['region']]
	});

	// query ES for species record
	let taxonomyData;
	let speciesRetrievalRecordID = null;

	if (data.species !== null && data.species !== '') {
		try {
			taxonomyData = await new TaxonomyService().getTaxonomyFromIds([data.species]);
		} catch (e) {
			log.error(e);
			throw new Error(`Unable to resolve species ${data.species}`);
		}

		console.dir(taxonomyData);

		if (taxonomyData.length !== 1) {
			throw new Error('Unexpected result size of retrieved taxonomy data');
		}

		const speciesRetrievalQueryResult = await db.query({
			text: `insert into species_retrieval_record(unit_name1, unit_name2, unit_name3, taxon_authority, code,
																									tty_kingdom, tty_name, english_name, note, taxonomy_id)
						 values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
						 returning id`,
			values: [
				taxonomyData[0].unit_name1,
				taxonomyData[0].unit_name2,
				taxonomyData[0].unit_name3,
				taxonomyData[0].taxon_authority,
				taxonomyData[0].code,
				taxonomyData[0].tty_kingdom,
				taxonomyData[0].tty_name,
				taxonomyData[0].english_name,
				taxonomyData[0].note,
				data.species
			]
		});

		speciesRetrievalRecordID = speciesRetrievalQueryResult.rows[0]['id'];

		await db.query({
			text: `update wildlife_health_id
						 set species_retrieval_record_id = $2
						 where id = $1`,
			values: [id, speciesRetrievalRecordID]
		});
	}

	// we're going to delete and recreate the details

	// delete dependent details first
	await db.query({
		text: `delete
					 from animal_identifier_detail_rapp_ear_tag
					 where id in (select id from animal_identifier where wildlife_health_id = $1)`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from animal_identifier_detail_ear_tag
					 where id in (select id from animal_identifier where wildlife_health_id = $1)`,
		values: [id]
	});

	// then delete the owning records
	await db.query({
		text: `delete
					 from animal_identifier
					 where wildlife_health_id = $1`,
		values: [id]
	});

	// now iterate identifiers and recreate
	for (const identifier of data.identifiers) {
		const idInsertQueryResult = await db.query({
			text: `insert into animal_identifier (wildlife_health_id, identifier_type_code, identifier)
						 values ($1, $2, $3)
						 returning id`,
			values: [id, identifier.type, identifier.identifier]
		});
		switch (identifier.type) {
		case 'RAPP_TAG':
			await db.query({
				text: `insert into animal_identifier_detail_rapp_ear_tag (id, ear)
							 values ($1, $2)`,
				values: [idInsertQueryResult.rows[0]['id'], identifier.earCode]
			});
			break;
		case 'EAR_TAG':
			await db.query({
				text: `insert into animal_identifier_detail_ear_tag (id, ear, colour)
							 values ($1, $2, $3)`,
				values: [idInsertQueryResult.rows[0]['id'], identifier.earCode, identifier.colour]
			});
			break;
		}
	}
}

async function doPurposeUpdate(db, id, data) {
	await db.query({
		text: `update wildlife_health_id
					 set primary_purpose            = $2,
							 secondary_purpose          = $3,
							 associated_project         = $4,
							 associated_project_details = $5
					 where id = $1`,
		values: [id, data['primaryPurpose'], data['secondaryPurpose'], data['associatedProject'], data['associatedProjectDetails']]
	});
}

async function doEventsUpdate(db, id, data) {
	await db.query({
		text: `delete
					 from event_location_details_city
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_civic_address
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_coordinates
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_herd_name
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_management_unit
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_population_unit
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_region
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location_details_utm_coordinates
					 where event_location_id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event_location
					 where id in
								 (select id from event_location where event_id in (select id from event where wildlife_health_id = $1))`,
		values: [id]
	});

	await db.query({
		text: `delete
					 from event
					 where wildlife_health_id = $1`,
		values: [id]
	});

	for (const event of data.events) {
		const eventInsertResult = await db.query({
			text: `insert into event (wildlife_health_id,
																event_type,
																start_date,
																age_class,
																samples_collected,
																samples_sent_for_testing,
																samples_results_received,
																submitter_retrieval_record_id,
																history)
						 values ($1,
										 $2,
										 $3,
										 $4,
										 $5,
										 $6,
										 $7,
										 copy_contact_list_person_into_retrieval_record($8),
										 $9)
						 returning id`,
			values: [
				id,
				event.type,
				event.startDate,
				event.ageClass,
				event.samples.collected,
				event.samples.sentForTesting,
				event.samples.resultsReceived,
				event.submitter,
				event.history
			]
		});

		for (const location of event.locations) {
			const locationInsertResult = await db.query({
				text: `insert into event_location (event_id, location_type_code)
							 values ($1,
											 $2)
							 returning id`,
				values: [eventInsertResult.rows[0]['id'], location.type]
			});
			switch (location.type) {
			case 'REGION':
				await db.query({
					text: `insert into event_location_details_region (event_location_id, region_id)
								 values ($1,
												 $2)`,
					values: [locationInsertResult.rows[0]['id'], location.region]
				});
				break;
			case 'MANAGEMENT_UNIT':
				await db.query({
					text: `insert into event_location_details_management_unit (event_location_id, management_unit_id)
								 values ($1,
												 $2)`,
					values: [locationInsertResult.rows[0]['id'], location.managementUnit]
				});
				break;
			case 'POPULATION_UNIT':
				await db.query({
					text: `insert into event_location_details_population_unit (event_location_id, population_unit_id)
								 values ($1,
												 $2)`,
					values: [locationInsertResult.rows[0]['id'], location.populationUnit]
				});
				break;
			case 'HERD_NAME':
				await db.query({
					text: `insert into event_location_details_herd_name (event_location_id, herd_name)
								 values ($1,
												 $2)`,
					values: [locationInsertResult.rows[0]['id'], location.herdName]
				});
				break;
			case 'COORDINATES':
				await db.query({
					text: `insert into event_location_details_coordinates (event_location_id, latitude, longitude)
								 values ($1,
												 $2,
												 $3)`,
					values: [locationInsertResult.rows[0]['id'], location.latitude, location.longitude]
				});
				break;
			case 'UTM_COORDINATES':
				await db.query({
					text: `insert into event_location_details_utm_coordinates (event_location_id, zone, northing, easting)
								 values ($1,
												 $2,
												 $3,
												 $4)`,
					values: [locationInsertResult.rows[0]['id'], location.zone, location.northing, location.easting]
				});
				break;
			case 'CITY':
				await db.query({
					text: `insert into event_location_details_city (event_location_id, city)
								 values ($1,
												 $2)`,
					values: [locationInsertResult.rows[0]['id'], location.city]
				});
				break;
			case 'CIVIC_ADDRESS':
				await db.query({
					text: `insert into event_location_details_civic_address (event_location_id, city, address)
								 values ($1,
												 $2,
												 $3)`,
					values: [locationInsertResult.rows[0]['id'], location.city, location.civicAddress]
				});
				break;
			}
		}
	}
}

const HealthIDsService = {
	listIDsByYear: async db => {
		const queryResult = await db.query({
			text: `SELECT w.id,
										w.id_number,
										w.computed_wildlife_id      as wlh_id,
										w.current_status,
										w.flagged,
										w.updated_after_creation,
										r.name                      as region,
										sex.name                    as sex,
										y.name                      as year,
										p.name                      as primary_purpose,
										srr.english_name            as species,
										requester.first_name        as requester_first_name,
										requester.last_name         as requester_last_name,
										requester.organization_name as requester_organization
						 from wildlife_health_id w
										left join region r on w.region_id = r.id
										left join purpose p on w.primary_purpose = p.code
										left join year y on y.id = w.year_id
										left join animal_sex sex on w.animal_sex_code = sex.code
										left join species_retrieval_record srr on w.species_retrieval_record_id = srr.id
										left join contact_list_person_retrieval_record requester
															on w.requester_retrieval_record_id = requester.id
						 order by y.ends desc, w.id_number
			`,
			values: []
		});
		return queryResult.rows;
	},

	getId: async (db, id) => {
		const queryResult = await db.query({
			text: `select json
						 from whis_json_wildlife_health_id
						 where id = $1`,
			values: [id]
		});

		if (queryResult.rows.length !== 1) {
			throw new Error('unknown id');
		}

		const result = {
			...queryResult.rows[0]['json']
		};

		return result;
	},

	patchId: async (db, id, patchRequest: IPatchRequest) => {
		const updateQueries = [];

		switch (patchRequest.mode) {
		case 'DETAIL':
			await doDetailUpdate(db, id, patchRequest.data);
			break;
		case 'EVENTS':
			await doEventsUpdate(db, id, patchRequest.data);
			break;
		case 'PURPOSE':
			await doPurposeUpdate(db, id, patchRequest.data);
			break;
		}

		for (const q of updateQueries) {
			await db.query(q);
		}

		const queryResult = await db.query({
			text: `select json
						 from whis_json_wildlife_health_id
						 where id = $1`,
			values: [id]
		});

		if (queryResult.rows.length !== 1) {
			throw new Error('unknown id');
		}

		const result = {
			...queryResult.rows[0]['json']
		};

		return result;
	},

	generateIDs: async (db, email: string, generationRequest: IGenerationRequest) => {
		const lockHeldQuery = await db.query({
			text: 'SELECT COUNT(*) as held_lock from generation_lock_holder where email = $1',
			values: [email]
		});
		if (parseInt(lockHeldQuery.rows[0]['held_lock']) !== 1) {
			log.warn('we do not hold the lock!');
			throw new Error('Cannot generate. Do not hold the lock');
		}

		let taxonomyData;
		let speciesRetrievalRecordID = null;

		if (generationRequest.species !== null) {
			try {
				taxonomyData = await new TaxonomyService().getTaxonomyFromIds([generationRequest.species]);
			} catch (e) {
				log.error(e);
				throw new Error(`Unable to resolve species ${generationRequest.species}`);
			}

			if (taxonomyData.length !== 1) {
				throw new Error('Unexpected result size of retrieved taxonomy data');
			}

			const speciesRetrievalQueryResult = await db.query({
				text: `insert into species_retrieval_record(unit_name1, unit_name2, unit_name3, taxon_authority, code,
																										tty_kingdom, tty_name, english_name, note, taxonomy_id)
							 values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
							 returning id`,
				values: [
					taxonomyData[0].unit_name1,
					taxonomyData[0].unit_name2,
					taxonomyData[0].unit_name3,
					taxonomyData[0].taxon_authority,
					taxonomyData[0].code,
					taxonomyData[0].tty_kingdom,
					taxonomyData[0].tty_name,
					taxonomyData[0].english_name,
					taxonomyData[0].note,
					generationRequest.species
				]
			});

			speciesRetrievalRecordID = speciesRetrievalQueryResult.rows[0]['id'];
		}

		const generationRecordQueryResult = await db.query({
			text: `INSERT INTO generation_record(application_user_id)
						 values ((select id from "application_user" where email = $1))
						 returning id`,
			values: [email]
		});

		const generationRecordID = generationRecordQueryResult.rows[0]['id'];

		const qty = generationRequest.quantity;

		const yearQuery = await db.query({
			text: `select id as year_id, high_water_mark as seq
						 from year
						 where id = $1`,
			values: [generationRequest.year]
		});

		const yearId = yearQuery.rows[0]['year_id'];
		const lastSequenceNumber = parseInt(yearQuery.rows[0]['seq']);

		const result = await db.query({
			text: `with created as (INSERT INTO wildlife_health_id (generation_record_id,
																															year_id,
																															id_number,
																															current_status,
																															region_id,
																															requester_retrieval_record_id,
																															primary_purpose,
																															associated_project,
																															associated_project_details,
																															species_retrieval_record_id)
				select $1,
							 $2,
							 generate_series($3 + 1, $3 + $4),
							 $5,
							 $6,
							 copy_contact_list_person_into_retrieval_record($7),
							 $8,
							 $9,
							 $10,
							 $11
				returning computed_wildlife_id, id)
						 select created.id, created.computed_wildlife_id as wlh_id
						 from created`,
			values: [
				generationRecordID,
				yearId,
				lastSequenceNumber,
				qty,
				generationRequest.initialStatus,
				generationRequest.region,
				generationRequest.requester,
				generationRequest.purpose,
				generationRequest.project,
				generationRequest.projectDetail,
				speciesRetrievalRecordID
			]
		});

		return result.rows;
	},

	testLock: async (db, email: string) => {
		const queryResult = await db.query({
			text: 'SELECT * from generation_lock_holder',
			values: []
		});

		if (queryResult.rowCount === 0) {
			//dispatchEvent(WHISEvent.LOCK_BECOMES_AVAILABLE);
			return {
				canLock: true,
				lockHolder: null
			};
		}
		if (queryResult.rows[0].email === email) {
			return {
				canLock: true,
				lockHolder: {
					email: queryResult.rows[0].email,
					isSelf: true,
					expires: queryResult.rows[0].expires
				}
			};
		}
		//dispatchEvent(WHISEvent.LOCK_BECOMES_UNAVAILABLE);
		return {
			canLock: false,
			lockHolder: {
				email: queryResult.rows[0].email,
				isSelf: false,
				expires: queryResult.rows[0].expires
			}
		};
	},

	acquireLock: async (db, email: string) => {
		try {
			await db.query({
				text: 'INSERT INTO generation_lock(email) values ($1)',
				values: [email]
			});
			//dispatchEvent(WHISEvent.LOCK_BECOMES_UNAVAILABLE);
			return true;
		} catch (err) {
			log.error('error acquiring generation lock');
			log.error(err.toString());
			return false;
		}
	},

	renewLock: async (db, email: string) => {
		try {
			await db.query({
				text: `UPDATE generation_lock
							 set expires = current_timestamp + interval '3 minutes'
							 where email = $1
								 and not released
								 and tstzrange(acquired, expires) @> current_timestamp;`,
				values: [email]
			});
			return true;
		} catch (err) {
			log.error('error acquiring generation lock');
			log.error(err.toString());
			return true;
		}
	},

	releaseLock: async (db, email: string) => {
		try {
			await db.query({
				text: `UPDATE generation_lock
							 set released = true
							 where email = $1
								 and not released
								 and tstzrange(acquired, expires) @> current_timestamp;`,
				values: [email]
			});
			//dispatchEvent(WHISEvent.LOCK_BECOMES_AVAILABLE);
			return true;
		} catch (err) {
			log.error('error acquiring generation lock');
			log.error(err.toString());
			return true;
		}
	}
};

export default HealthIDsService;
