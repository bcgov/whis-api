import jwksRsa from 'jwks-rsa';
import {Response} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
import {WHISRequest} from './app';
import UserService from './services/user';
import {Pool} from 'pg';
import {log} from './util/log';

//values we can expect to exist in the token
interface WHISJWTPayload extends JwtPayload {
	email: string;
	name: string;
	preferred_username: string;
}

const jwksMiddleware = (pool: Pool, options: {jwksUri: string}) => {
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
				return;
			}

			let token;
			try {
				token = authHeader.split(/\s/)[1];
			} catch (err) {
				log.error('caught error while decoding token, sending 401');
				log.error(err.toString());
				response.status(401).send();
				return;
			}
			if (!token) {
				response.status(401).send();
				return;
			}

			jwt.verify(token, retrieveKey, {}, function (error, decoded) {
				if (error) {
					log.error(error.toString());
					response.status(401).send();
					return;
				}

				const whisSpecificJWT = decoded as WHISJWTPayload;

				const subject = whisSpecificJWT.sub;

				UserService.getRolesForUser(pool, whisSpecificJWT.email).then(roles => {
					req.whisContext = {
						subject: subject,
						name: whisSpecificJWT.name,
						preferredUsername: whisSpecificJWT.preferred_username,
						email: whisSpecificJWT.email,
						roles
					};
					next();
				});
			});
		}
	};
};
export {jwksMiddleware};
