async function getRolesForUser(db, email: string): Promise<string[]> {
	const queryResult = await db.query({
		text: `select array_agg(r.name) as roles
					 from role r
									inner join role_mapping rm on r.id = rm.role_id
									inner join "user" u on u.id = rm.user_id
					 where u.email = $1`,
		values: [email]
	});

	// array_agg returns null, not an empty array. coalescing it is more convenient for parsing in the frontend.
	const queriedRoles = queryResult.rows[0]['roles'];
	if (queriedRoles !== null) {
		return queriedRoles;
	}

	return [];
}

async function getAccessRequest(db, email: string): Promise<any> {
	const queryResult = await db.query({
		text: `select *
					 from access_request
					 where email = $1`,
		values: [email]
	});

	if (queryResult.rowCount === 0) {
		return null;
	}

	return queryResult.rows[0];
}

async function createAccessRequest(db, email: string, reason?: string | null): Promise<void> {
	await db.query({
		text: `insert into access_request(email, reason)
					 values ($1, $2) on conflict (email)
					 do
		update set update_time = current_timestamp`,
		values: [email, reason]
	});
}

const UserService = {
	getRolesForUser,
	getAccessRequest,
	createAccessRequest
};

export default UserService;
