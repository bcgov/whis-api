import http from 'http';
import {CONFIG} from './config';
import {buildApp} from './app';
import pg from 'pg';

const pool = new pg.Pool({
	user: CONFIG.DB_USER,
	database: CONFIG.DB_NAME,
	password: CONFIG.DB_PASSWORD,
	host: CONFIG.DB_HOST,
	port: CONFIG.DB_PORT,
	max: 10
});

pool.on('connect', client => {
	client.query('SET search_path TO whis');
});

pool.on('error', (err: Error): void => {
	console.log(`postgresql error: ${err}`);
});

const app = buildApp(pool);

const server = http.createServer(app);

server.listen(CONFIG.LISTEN_PORT, () => {
	console.log(`listening on port ${CONFIG.LISTEN_PORT}`);
});
