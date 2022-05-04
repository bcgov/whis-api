export interface IGenerationRequest {
	quantity: number;
}

const HealthIDsService = {
	listIDsByYear: async db => {
		const queryResult = await db.query({
			text: 'SELECT y.short_name AS YEAR, id.id AS id, id."number" AS "number" FROM id AS id LEFT OUTER JOIN YEAR y ON id.year_id = y.id ORDER BY YEAR DESC, "number" ASC',
			values: []
		});
		return queryResult.rows;
	},

	generateIDs: async (db, email: string, generationRequest: IGenerationRequest) => {
		const lockHeldQuery = await db.query({
			text: 'SELECT COUNT(*) as held_lock from generation_lock_holder where email = $1',
			values: [email]
		});
		if (parseInt(lockHeldQuery.rows[0]['held_lock']) !== 1) {
			console.error('we do not hold the lock!');
			throw new Error('Cannot generate. Do not hold the lock');
		}

		const generationRecordQueryResult = await db.query({
			text: 'INSERT INTO generation_record(user_id) values ((select id from "user" where email = $1)) returning id',
			values: [email]
		});

		const generationRecordID = generationRecordQueryResult.rows[0]['id'];

		const qty = generationRequest.quantity;

		await db.query({
			text: `INSERT INTO id(generation_record_id, year_id)
						 select $1, (select id from year where current_date >= starts and current_date < ends)
						 from generate_series(1, ${qty})`,
			values: [generationRecordID]
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
			console.error('error acquiring generation lock');
			console.error(err);
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
			console.error('error renewing generation lock');
			console.error(err);
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
			console.error('error releasing generation lock');
			console.error(err);
			return true;
		}
	}
};

export default HealthIDsService;
