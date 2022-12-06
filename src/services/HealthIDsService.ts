import {log} from '../util/Log';
import {dispatchEvent, WHISEvent} from './EventBus';

export interface IGenerationRequest {
	quantity: number;
	year: string;
	purpose: string | null;
	species: string | null;
	project: string | null;
	homeRegion: string | null;
	initialStatus: string;
	projectDetail: string | null;
	requester: {
		role: string | null;
		organization: string | null;
		region: string | null;
		email: string | null;
		phoneNumber: string | null;
		firstName: string;
		lastName: string;
	};
}

const HealthIDsService = {
	listIDsByYear: async db => {
		const queryResult = await db.query({
			text: 'SELECT * from id_by_year',
			values: []
		});
		return queryResult.rows;
	},

	getId: async (db, id) => {
		const queryResult = await db.query({
			text: `select iby.id,
										iby.number,
										iby.wlh_id,
										gr.created_at,
										u.email,
										gr.species,
										gr.purpose,
										gr.project,
										gr.project_detail,
										gr.requester_role,
										gr.requester_email,
										gr.requester_phone,
										gr.requester_organization,
										gr.requester_region,
										gr.requester_first_name,
										gr.requester_last_name,
										gr.initial_status,
										gr.home_region,
										detail.persisted_form_state
						 from id_by_year as iby
										inner join year y on iby.year_id = y.id
										inner join id i on iby.id = i.id
										inner join generation_record gr on gr.id = i.generation_record_id
										inner join "user" u on u.id = gr.user_id
										left outer join id_detail detail on detail.wildlife_health_id = i.id
						 where iby.id = $1`,
			values: [id]
		});

		if (queryResult.rows.length !== 1) {
			throw new Error('unknown id');
		}

		const result = {
			...queryResult.rows[0]
		};

		const eventQueryResult = await db.query({
			text: `select e.*
						 from event as e
						 where e.wildlife_health_id = $1`,
			values: [id]
		});

		result.events = eventQueryResult.rows;

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

		const generationRecordQueryResult = await db.query({
			text: `INSERT INTO generation_record(user_id, species, purpose, project, initial_status, home_region,
																					 project_detail, requester_first_name, requester_last_name,
																					 requester_region, requester_organization,
																					 requester_phone, requester_email, requester_role)
						 values ((select id from "user" where email = $1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
						 returning id`,
			values: [
				email,
				generationRequest.species,
				generationRequest.purpose,
				generationRequest.project,
				generationRequest.initialStatus,
				generationRequest.homeRegion,
				generationRequest.projectDetail,
				generationRequest.requester.firstName,
				generationRequest.requester.lastName,
				generationRequest.requester.region,
				generationRequest.requester.organization,
				generationRequest.requester.phoneNumber,
				generationRequest.requester.email,
				generationRequest.requester.role
			]
		});

		const generationRecordID = generationRecordQueryResult.rows[0]['id'];

		const qty = generationRequest.quantity;

		//@todo trust the year on the incoming generation request
		const yearQuery = await db.query({
			text: `select id as year_id, coalesce(last_sequence_value, 1) as seq
						 from year
						 where current_date >= starts
							 and current_date < ends`,
			values: []
		});

		const yearId = yearQuery.rows[0]['year_id'];
		const lastSequenceNumber = parseInt(yearQuery.rows[0]['seq']);

		await db.query({
			text: `INSERT INTO id(generation_record_id, year_id, number)
						 select $1, $2, generate_series($3 + 1, $3 + $4)`,
			values: [generationRecordID, yearId, lastSequenceNumber, qty]
		});
	},

	testLock: async (db, email: string) => {
		const queryResult = await db.query({
			text: 'SELECT * from generation_lock_holder',
			values: []
		});

		if (queryResult.rowCount === 0) {
			dispatchEvent(WHISEvent.LOCK_BECOMES_AVAILABLE);
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
		dispatchEvent(WHISEvent.LOCK_BECOMES_UNAVAILABLE);
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
			dispatchEvent(WHISEvent.LOCK_BECOMES_UNAVAILABLE);
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
								 and tstzrange(acquired, expires) @ > current_timestamp;`,
				values: [email]
			});
			dispatchEvent(WHISEvent.LOCK_BECOMES_AVAILABLE);
			return true;
		} catch (err) {
			log.error('error acquiring generation lock');
			log.error(err.toString());
			return true;
		}
	}
};

export default HealthIDsService;
