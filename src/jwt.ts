import jwksRsa from 'jwks-rsa';
import {Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import UserService from './services/user_service';
import {WHISRequest} from './server';

interface JWTEnhancedRequest extends Request {
	jwtClaims: {
		sub: string | null;
		name: string | null;
		preferredUsername: string | null;
		email: string | null;
	};

	whisContext: {
		organization: number;
		subject: string | null;
	};
}

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

				req.jwtClaims = {
					sub: decoded.sub,
					name: decoded.name,
					preferredUsername: decoded.preferred_username,
					email: decoded.email
				};

				const subject = decoded.sub;

				req.whisContext = {
					organization: await UserService.mapSubjectToOrganizationId(req.database.pool, subject),
					subject: subject
				};
				next();
			} catch (err) {
				response.status(401).send();
			}
		}
	};
};
export {jwksMiddleware, JWTEnhancedRequest};
