import {Pool, QueryConfig, QueryResult} from 'pg';
import {Request, Response} from 'express';

interface TransactionalRequest extends Request {
	database: {
		pool: Pool;
		query: (QueryConfig) => Promise<QueryResult<unknown>>;
		rollback: () => void;
	};
}

const DatabaseMiddleware = (databaseConnection: Pool) => {
	databaseConnection
		.connect()
		.then(client => {
			console.log('Database connection ok');
			client.release();
		})
		.catch(err => {
			console.error(`database connection error: ${err}`);
			throw err;
		});

	return {
		transactional: () => async (req: TransactionalRequest, response: Response, next: () => void) => {
			const client = await databaseConnection.connect();
			let shouldRollback = false;
			await client.query('BEGIN TRANSACTION');

			req.database = {
				pool: databaseConnection,
				rollback: () => {
					shouldRollback = true;
				},
				query: async (queryConfig: QueryConfig) => {
					try {
						return await client.query(queryConfig);
					} catch (err) {
						console.log(`Error in database query: ${err}, scheduling rollback`);
						shouldRollback = true;
						throw err;
					}
				}
			};

			next();

			try {
				if (shouldRollback) {
					await client.query('ROLLBACK');
				} else {
					await client.query('COMMIT');
				}
			} finally {
				client.release();
			}
		}
	};
};

export {DatabaseMiddleware, TransactionalRequest};
