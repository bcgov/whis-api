const YearsService = {
	listYears: async db => {
		const queryResult = await db.query({
			text: 'SELECT name,short_name, starts, ends, last_sequence_value FROM year order by ends desc',
			values: []
		});

		return queryResult.rows;
	}
};

export default YearsService;
