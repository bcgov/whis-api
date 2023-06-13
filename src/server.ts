import http from 'http';
import {Config} from './config';
import {buildApp} from './app';
import pg from 'pg';
import {log} from './util/log';
import Indexer from './services/search/search_indexer';

export const pool = new pg.Pool({
	user: Config.DB_USER,
	database: Config.DB_NAME,
	password: Config.DB_PASSWORD,
	host: Config.DB_HOST,
	port: Config.DB_PORT,
	max: 100
});

pool.on('connect', client => {
	client.query('SET search_path TO whis');
});

pool.on('error', (err: Error): void => {
	log.error(`postgresql error: ${err}`);
});

const indexer = new Indexer();
indexer.start();

const app = buildApp(pool, {useTestSecurity: false});

const server = http.createServer(app);
server.setMaxListeners(25);

server.listen(Config.LISTEN_PORT, () => {
	log.info(`listening on port ${Config.LISTEN_PORT}`);
});
