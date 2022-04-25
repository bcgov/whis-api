import cors from 'cors';
import helmet from 'helmet';
import express, {Request, Response} from 'express';
import morgan from 'morgan';
import {jwksMiddleware} from './JWT';
import {DatabaseMiddleware, TransactionalRequest} from './Database';
import {HealthCheck, NotFound} from './apis/Common';
import {Pool} from 'pg';
import CodeTables from './apis/CodeTables';
import {Config} from './Config';
import {testSecurityMiddleware} from './test_helpers/TestSecurity';
import HealthIDs from './apis/HealthIDs';

const prefix = '/api/v1';

export interface WHISRequest extends TransactionalRequest {
	whisContext: {
		subject: string | null;
		preferredUsername: string | null;
		email: string | null;
		name: string | null;
	};
}

function catchAllErrorHandler(err, req: Request, res: Response, next) {
	console.error(err.stack);
	res.status(500).send({error: 'An internal error has occurred.'});
}

export interface RuntimeConfig {
	useTestSecurity: boolean;
}

export function buildApp(databaseConnection: Pool, runtimeConfig: RuntimeConfig) {
	const databaseMiddleware = DatabaseMiddleware(databaseConnection);

	let securityMiddleware;
	if (runtimeConfig.useTestSecurity) {
		// use a fake security middleware for testing purposes
		securityMiddleware = testSecurityMiddleware();
	} else {
		// use real JWT parser/verifier
		securityMiddleware = jwksMiddleware({jwksUri: Config.JWKS_URL});
	}

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
		.use(catchAllErrorHandler)

		.get(`${prefix}/ids`, securityMiddleware.protect(), HealthIDs.List)

		.get(`${prefix}/codes`, securityMiddleware.protect(), CodeTables.List)
		.get(`${prefix}/codes/:id`, securityMiddleware.protect(), CodeTables.Get)

		.get('/health', HealthCheck)
		.get('*', NotFound);

	app.options('*', cors());
	return app;
}
