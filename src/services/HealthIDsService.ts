import {log} from '../util/Log';

export interface IGenerationRequest {
	quantity: number;
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
										gr.reason,
										gr.purpose,
										gr.project,
										r.name as region
						 from id_by_year as iby
										join year y on iby.year_id = y.id
										join id i on iby.id = i.id
										join generation_record gr on gr.id = i.generation_record_id
										join "user" u on u.id = gr.user_id
										join region r on r.id = gr.region_id
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
			text: 'INSERT INTO generation_record(user_id) values ((select id from "user" where email = $1)) returning id',
			values: [email]
		});

		const generationRecordID = generationRecordQueryResult.rows[0]['id'];

		const qty = generationRequest.quantity;

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
			return true;
		} catch (err) {
			log.error('error acquiring generation lock');
			log.error(err.toString());
			return true;
		}
	}
};

export default HealthIDsService;
