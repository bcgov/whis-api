const CodeTablesService = {
	listCodeTables: async db => {
		const queryResult = await db.query({
			text: 'SELECT name,displayed_name FROM code_table',
			values: []
		});

		return queryResult.rows;
	},

	getCodeTable: async (db, name: string) => {
		const queryResult = await db.query({
			text: `SELECT c.id, c.value, c.displayed_value, c.help_text, cat.path AS categories, c.effective, c.expires
						 FROM code AS c
										LEFT JOIN category_expanded AS cat ON cat.id = c.category_id
						 WHERE c.code_table_id = (SELECT id FROM code_table WHERE name = $1)
							 AND (c.effective <= CURRENT_DATE)
							 AND (c.expires IS NULL OR c.expires > CURRENT_DATE)`,
			values: [name]
		});

		return queryResult.rows;
	}
};

export default CodeTablesService;
