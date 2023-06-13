import {Pool, QueryConfig, QueryResult} from 'pg';
import {Request, Response} from 'express';
import {log} from './util/log';

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
			log.debug('Database connection ok');
			client.release();
		})
		.catch(err => {
			log.error(`database connection error: ${err}`);
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
						log.error(`Error in database query: ${err}, scheduling rollback`);
						shouldRollback = true;
						throw err;
					}
				}
			};

			response.on('finish', () => {
				try {
					if (shouldRollback) {
						log.info('rollback');
						client.query('ROLLBACK');
					} else {
						log.debug('commit');
						client.query('COMMIT');
					}
				} finally {
					client.release();
				}
			});

			next();
		}
	};
};

export {DatabaseMiddleware, TransactionalRequest};
