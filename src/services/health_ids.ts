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

	persistData: async (db, id, data) => {
		const queryResult = await db.query({
			text: `insert into id_detail (wildlife_health_id, persisted_form_state)
						 values ($1, $2)
						 on conflict (wildlife_health_id)
							 do update set persisted_form_state = $2
						 returning persisted_form_state`,
			values: [id, data]
		});

		if (queryResult.rows.length !== 1) {
			throw new Error('no update performed');
		}

		const result = {
			...queryResult.rows[0]
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
																										tty_kingdom, tty_name, english_name, note)
							 values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
				values: [
					taxonomyData[0].unit_name1,
					taxonomyData[0].unit_name2,
					taxonomyData[0].unit_name3,
					taxonomyData[0].taxon_authority,
					taxonomyData[0].code,
					taxonomyData[0].tty_kingdom,
					taxonomyData[0].tty_name,
					taxonomyData[0].english_name,
					taxonomyData[0].note
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
								 and tstzrange(acquired
											 , expires) @
								 > current_timestamp;`,
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
