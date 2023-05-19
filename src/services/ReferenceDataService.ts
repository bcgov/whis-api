const ReferenceDataService = {
	getReferenceData: async db => {
		const referenceQueries = [
			{
				short_name: 'animal_sex',
				display_name: 'Animal Sex',
				query: `SELECT code, name
                from animal_sex
                order by sort_order asc, name`
			},
			{
				short_name: 'animal_ear',
				display_name: 'Animal Ear',
				query: `SELECT code, name
                from animal_ear
                order by sort_order asc, name`
			},
			{
				short_name: 'animal_identifier_type',
				display_name: 'Animal Identifier Type',
				query: `SELECT code, name
                from animal_identifier_type
                order by sort_order asc, name`
			},
			{
				short_name: 'location_type',
				display_name: 'Location Type',
				query: `SELECT code, name
                from location_type
                order by sort_order asc, name`
			},
			{
				short_name: 'organizational_role',
				display_name: 'Organizational Role',
				query: `SELECT code, name
                from organizational_role
                order by sort_order asc, name`
			},
			{
				short_name: 'purpose',
				display_name: 'Purpose',
				query: `SELECT code, name
                from purpose
                order by sort_order asc, name`
			},
			{
				short_name: 'region',
				display_name: 'Region',
				query: `SELECT id                                                                            as code,
                       name,
                       ((effective <= CURRENT_DATE) AND (expires IS NULL OR expires > CURRENT_DATE)) as currently_valid
                from region
                order by sort_order asc, name`
			},
			{
				short_name: 'population_unit',
				display_name: 'Population Unit',
				query: `SELECT id                                                                            as code,
                       name,
                       ((effective <= CURRENT_DATE) AND (expires IS NULL OR expires > CURRENT_DATE)) as currently_valid
                from population_unit
                order by sort_order asc, name`
			},
			{
				short_name: 'management_unit',
				display_name: 'Management Unit',
				query: `SELECT id                                                                            as code,
                       name,
                       ((effective <= CURRENT_DATE) AND (expires IS NULL OR expires > CURRENT_DATE)) as currently_valid

                from population_unit
                order by sort_order asc, name`
			},
			{
				short_name: 'organization',
				display_name: 'Organization',
				query: `SELECT id as code,
       					name
                from contact_list_organization
                order by name asc`
			}
		];

		const referenceData = {};

		for (const q of referenceQueries) {
			const codes = await db.query({
				text: q.query
			});

			referenceData[q.short_name] = {
				codes: codes.rows,
				name: q.short_name,
				displayed_name: q.display_name
			};
		}

		return referenceData;
	}
};

export default ReferenceDataService;
