import http from 'http';
import {Config} from './Config';
import {buildApp} from './App';
import pg from 'pg';

const pool = new pg.Pool({
	user: Config.DB_USER,
	database: Config.DB_NAME,
	password: Config.DB_PASSWORD,
	host: Config.DB_HOST,
	port: Config.DB_PORT,
	max: 10
});

pool.on('connect', client => {
	client.query('SET search_path TO whis');
});

pool.on('error', (err: Error): void => {
	console.log(`postgresql error: ${err}`);
});

const app = buildApp(pool, {useTestSecurity: false});

const server = http.createServer(app);

server.listen(Config.LISTEN_PORT, () => {
	console.log(`listening on port ${Config.LISTEN_PORT}`);
});
