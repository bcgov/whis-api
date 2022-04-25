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

	JWKS_URL: process.env.JWKS_URL,

	RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST,
	RABBIT_MQ_VHOST: process.env.RABBIT_MQ_VHOST,
	RABBIT_MQ_USER: process.env.RABBIT_MQ_USER,
	RABBIT_MQ_PASSWORD: process.env.RABBIT_MQ_PASSWORD
};

export {Config};
