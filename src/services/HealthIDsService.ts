const HealthIDsService = {
	listIDsByYear: async pool => {
		const queryResult = await pool.query({
			text: 'SELECT y.short_name AS YEAR, id.id AS id, id."number" AS "number" FROM id AS id LEFT OUTER JOIN YEAR y ON id.year_id = y.id ORDER BY YEAR DESC, "number" ASC',
			values: []
		});
		return queryResult.rows;
	}
};

export default HealthIDsService;
