import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import morgan from 'morgan';
import {JWTEnhancedRequest} from './jwt';
import {DatabaseMiddleware, TransactionalRequest} from './database';
import {HealthCheck, NotFound} from './apis/common';
import {Pool} from 'pg';

const prefix = '/api/v1';

export interface WHISRequest extends JWTEnhancedRequest, TransactionalRequest {}

export function buildApp(databaseConnection: Pool) {
	const databaseMiddleware = DatabaseMiddleware(databaseConnection);

	const app = express()
		.use(helmet())
		.use(cors())
		.use(
			morgan('tiny', {
				skip: (req, res) => req.url === '/health'
			})
		)
		.use(express.json())
		.use(databaseMiddleware.transactional())
		.use((err, req, res, next) => {
			console.error(err.stack);
			res.status(500).send({status: 'Error'});
		})
		.get('/health', HealthCheck)
		.get('*', NotFound);

	app.options('*', cors());
	return app;
}
