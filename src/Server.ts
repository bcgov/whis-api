import http from 'http';
import {Config} from './Config';
import {buildApp} from './App';
import pg from 'pg';
import {log} from './util/Log';
import {SearchService} from './services/Search';

export const pool = new pg.Pool({
	user: Config.DB_USER,
	database: Config.DB_NAME,
	password: Config.DB_PASSWORD,
	host: Config.DB_HOST,
	port: Config.DB_PORT,
	max: 100
});

let indexing = false;
let tryIndex = false;

pool.on('connect', client => {
	client.query('SET search_path TO whis');

	if (tryIndex) {
		if (!indexing) {
			indexing = true;
			const search = new SearchService();
			search.reindexAll().then(() => {
				indexing = false;
				tryIndex = false;
			});
		}
	}
});

pool.on('error', (err: Error): void => {
	log.error(`postgresql error: ${err}`);
});

const app = buildApp(pool, {useTestSecurity: false});

const server = http.createServer(app);
server.setMaxListeners(25);

server.listen(Config.LISTEN_PORT, () => {
	log.info(`listening on port ${Config.LISTEN_PORT}`);
});
