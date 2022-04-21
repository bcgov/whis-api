import request from 'supertest';
import {createPool} from '../test_helpers/Constants';
import {buildApp} from '../App';
import setup from '../test_helpers/Setup';
import teardown from '../test_helpers/Teardown';
import {generateTestSecurityHeader, TEST_SECURITY_HEADER} from '../test_helpers/TestSecurity';

describe('API Tests', () => {
	let database;
	let app;

	const securityHeaders = [];

	beforeAll(async () => {
		await setup();

		database = createPool();
		app = buildApp(database, {useTestSecurity: true});
		global['runningInTest'] = true;

		securityHeaders['testUser1'] = {
			[TEST_SECURITY_HEADER]: generateTestSecurityHeader('testUser1')
		};
	});

	afterAll(async () => {
		await database.end();
		await teardown();
	});

	describe('All API Tests', function () {
		describe('Shared API', function () {
			it('should respond to health check with 200', async () => {
				const response = await request(app).get('/health');

				expect(response.status).toEqual(200);
				expect(response.body.status).toEqual('ok');
			});
		});

		describe('Test Security', function () {
			it('should return a 401 Unauthorized', async () => {
				const response = await request(app).get('/api/v1/codes');
				// missing security header
				expect(response.status).toEqual(401);
			});
		});

		describe('Code Tables API', function () {
			it('should return a list of code tables', async () => {
				const response = await request(app).get('/api/v1/codes').set(securityHeaders['testUser1']);

				expect(response.status).toEqual(200);
				expect(response.body.length).toBeGreaterThan(0);
			});
			it('should return individual code table items with expanded categories', async () => {
				const response = await request(app).get('/api/v1/codes/unit_test_codes_category').set(securityHeaders['testUser1']);

				expect(response.status).toEqual(200);
				const codes = response.body;

				expect(codes.length).toBeGreaterThan(0);

				expect(codes.find(c => c.value === 'uke').categories).toEqual(['instruments', 'string']);
				// only one kind of milk should exist (the others are expired or have not yet come into existence)
				expect(codes.filter(c => c.value.match(/.*?milk$/)).length).toEqual(1);
			});
		});
	});
});
