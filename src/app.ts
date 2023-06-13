import cors from 'cors';
import helmet from 'helmet';
import express, {Request, Response} from 'express';
import morgan from 'morgan';
import {jwksMiddleware} from './jwt';
import {DatabaseMiddleware, TransactionalRequest} from './db';
import {HealthCheck, NotFound} from './endpoints/common';
import {Pool} from 'pg';
import CodeTables from './endpoints/code_tables';
import {Config} from './config';
import {testSecurityMiddleware} from './test_helpers/TestSecurity';
import HealthIDs from './endpoints/health_ids';
import User from './endpoints/user';
import Years from './endpoints/years';
import {log} from './util/log';
import Autofill from './endpoints/autofill';
import ContactList from './endpoints/contact_list';

const prefix = '/api/v1';

export interface WHISRequest extends TransactionalRequest {
	whisContext: {
		subject: string | null;
		preferredUsername: string | null;
		email: string | null;
		name: string | null;
		roles: string[] | null;
	};
}

function catchAllErrorHandler(err, req: Request, res: Response, next) {
	log.error(err.toString());
	res.status(500).json({error: 'An internal error has occurred.', detail: err.stack});
	next();
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
		securityMiddleware = jwksMiddleware(databaseConnection, {jwksUri: Config.JWKS_URL});
	}

	const app = express()
		.use(helmet())
		.use(cors())
		.use(
			morgan('tiny', {
				stream: {
					write: msg => log.info(msg, {service: 'http'})
				},
				skip: (req, res) => req.url === '/health'
			})
		)
		.use(express.json())
		.use(databaseMiddleware.transactional())

		.get(`${prefix}/users/me`, securityMiddleware.protect(), User.Me)
		.post(`${prefix}/users/access_request`, securityMiddleware.protect(), User.RequestAccess)
		.get(`${prefix}/users/access_request`, securityMiddleware.protect(), User.GetAccessRequest)

		.get(`${prefix}/ids`, securityMiddleware.protect(), HealthIDs.List)

		.post(`${prefix}/ids`, securityMiddleware.protect(), HealthIDs.Generate)

		.post(`${prefix}/ids/search`, securityMiddleware.protect(), HealthIDs.Search)

		.get(`${prefix}/ids/lock`, securityMiddleware.protect(), HealthIDs.TestLock)
		.post(`${prefix}/ids/lock`, securityMiddleware.protect(), HealthIDs.AcquireLock)
		.post(`${prefix}/ids/lock/renew`, securityMiddleware.protect(), HealthIDs.RenewLock)
		.delete(`${prefix}/ids/lock`, securityMiddleware.protect(), HealthIDs.ReleaseLock)

		.get(`${prefix}/ids/:id`, securityMiddleware.protect(), HealthIDs.Detail)
		.post(`${prefix}/ids/:id`, securityMiddleware.protect(), HealthIDs.Persist)

		.get(`${prefix}/codes`, securityMiddleware.protect(), CodeTables.List)

		.get(`${prefix}/contacts`, securityMiddleware.protect(), ContactList.List)
		.post(`${prefix}/contacts`, securityMiddleware.protect(), ContactList.Add)

		.get(`${prefix}/years`, securityMiddleware.protect(), Years.List)

		.get(`${prefix}/autofill/taxonomy/:q`, securityMiddleware.protect(), Autofill.TaxonomyAutofill)

		.get('/health', HealthCheck)
		.get('*', NotFound)

		.use(catchAllErrorHandler)

		.options('*', cors());
	return app;
}
