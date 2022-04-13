import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import {jwksMiddleware, JWTEnhancedRequest} from './jwt';
import {DatabaseMiddleware, TransactionalRequest} from './database';
import {CONFIG} from './config';
import {common} from './apis/common';

const prefix = '/api/v1';
const jwks = jwksMiddleware({jwksUri: CONFIG.JWKS_URL});
const databaseMiddleware = DatabaseMiddleware();

export interface WHISRequest extends JWTEnhancedRequest, TransactionalRequest {}

process.on('SIGTERM', () => {
	console.log('SIGTERM, exiting...');
	process.exit();
});

const app = express()
	.use(helmet())
	.use(cors())
	.use(morgan('combined'))
	.use(express.json())
	.use(databaseMiddleware.transactional())
	.use(function (err, req, res, next) {
		console.error(err.stack);
		res.status(500).send({status: 'Error'});
	})

	.get('/health', common.healthCheck)

	.get('*', common.notFound);

app.options('*', cors());

const server = http.createServer(app);

server.listen(CONFIG.LISTEN_PORT, () => {
	console.log(`listening on port ${CONFIG.LISTEN_PORT}`);
});
