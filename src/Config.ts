// global configuration goes here
import dotenv from 'dotenv';

dotenv.config();

const Config = {
	LISTEN_PORT: 6005,

	IS_PROD: process.env.NODE_ENV === 'production',
	DEVELOPMENT_MODE: true,

	DB_NAME: process.env.DB_DATABASE,
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: parseInt(process.env.DB_PORT),

	JWKS_URL: process.env.JWKS_URL || 'http://localhost:8888/auth/realms/whis/protocol/openid-connect/certs',

	KEYCLOAK_BASE_URL: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8888',
	KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'whis',
	KEYCLOAK_CLIENT: process.env.KEYCLOAK_CLIENT || 'whis',
	KEYCLOAK_SA: process.env.KEYCLOAK_SA,
	KEYCLOAK_SA_SECRET: process.env.KEYCLOAK_SA_SECRET,

	RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST || 'localhost',
	RABBIT_MQ_VHOST: process.env.RABBIT_MQ_VHOST || 'whis',
	RABBIT_MQ_USER: process.env.RABBIT_MQ_USER || 'rabbitmq',
	RABBIT_MQ_PASSWORD: process.env.RABBIT_MQ_PASSWORD || 'rabbitmq'
};

export {Config};
