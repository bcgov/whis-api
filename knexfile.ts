module.exports = {
	all: {
		client: 'pg',
		searchPath: ['knex', 'public'],
		connection: {
			host: process.env.DB_HOST,
			port: process.env.DB_PORT || 5432,
			database: process.env.DB_DATABASE || 'whis',
			user: process.env.DB_USER || 'whis',
			password: process.env.DB_PASSWORD,
			multipleStatements: true
		},
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'migration',
			directory: './data/migrations',
			schemaName: 'knex'
		}
	}
};
