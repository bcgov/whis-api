import jwksRsa from 'jwks-rsa';
import {Response} from 'express';
import jwt from 'jsonwebtoken';
import UserService from './services/UserService';
import {WHISRequest} from './App';

const jwksMiddleware = (options: {jwksUri: string}) => {
	const jwks = jwksRsa({
		jwksUri: options.jwksUri,
		cacheMaxAge: 3600,
		cache: true
	});

	function retrieveKey(header, callback) {
		jwks.getSigningKey(header.kid, function (err, key) {
			if (err) {
				throw err;
			}

			const signingKey = key.getPublicKey();
			callback(null, signingKey);
		});
	}

	return {
		protect: () => async (req: WHISRequest, response: Response, next: () => void) => {
			const authHeader = req.header('Authorization');

			if (!authHeader) {
				response.status(401).send();
			}

			const token = authHeader.split(/\s/)[1];

			if (!token) {
				response.status(401).send();
			}

			try {
				const decoded = await jwt.verify(token, retrieveKey);

				const subject = decoded.sub;

				req.whisContext = {
					organization: await UserService.mapSubjectToOrganizationId(req.database.pool, subject),
					subject: subject,
					name: decoded.name,
					preferredUsername: decoded.preferred_username,
					email: decoded.email
				};
				next();
			} catch (err) {
				response.status(401).send();
			}
		}
	};
};
export {jwksMiddleware};
