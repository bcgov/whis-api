import {Response} from 'express';
import {WHISRequest} from '../App';
import {log} from '../util/Log';

const TEST_SECURITY_HEADER = 'X-Test-Authorization';

const generateTestSecurityHeader = username => {
	return username;
};

const testSecurityMiddleware = () => {
	return {
		protect: () => async (req: WHISRequest, response: Response, next: () => void) => {
			const authHeader = req.header(TEST_SECURITY_HEADER);

			// don't spam if we're running in test
			if (!('runningInTest' in global)) {
				log.warn('THIS APP IS RUNNING INSECURE MIDDLEWARE DESIGNED FOR TESTING');
			}

			if (process.env.NODE_ENV === 'production') {
				log.error("IT LOOKS LIKE YOU'RE RUNNING TEST SECURITY IN PRODUCTION MODE. BYE BYE.");
				process.exit(-1);
			}

			if (!authHeader) {
				return response.status(401).send();
			}

			const user = authHeader;

			if (!user) {
				return response.status(401).send();
			}

			req.whisContext = {
				preferredUsername: user,
				email: `${user}@whis.com`,
				name: user,
				subject: user,
				roles: ['TestRole']
			};

			next();
		}
	};
};

export {testSecurityMiddleware, generateTestSecurityHeader, TEST_SECURITY_HEADER};
