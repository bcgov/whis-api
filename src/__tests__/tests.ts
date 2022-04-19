import request from 'supertest';
import {createPool} from '../test_helpers/constants';
import {buildApp} from '../app';
import setup from '../test_helpers/setup';
import teardown from '../test_helpers/teardown';

describe('API Tests', () => {
	let database;
	let app;

	beforeAll(async () => {
		await setup();

		database = createPool();
		app = buildApp(database);
	});

	afterAll(async () => {
		await database.end();
		await teardown();
		console.log('shutting down final');
	});

	describe('common tests', function () {
		it('should respond to health check with 200', async () => {
			const response = await request(app).get('/health');

			expect(response.status).toEqual(200);
			expect(response.body.status).toEqual('ok');
		});
	});
});
