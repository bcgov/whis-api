const ContactListService = {
	getContacts: async db => {
		const contacts = await db.query({
			text: `select c.id,
                    c.first_name,
                    c.last_name,
                    c.organizational_role_code as role,
                    o.name                     as role_display_name,
                    c.email,
                    c.phone,
                    c.region_id                as region,
                    r.name                     as region_display_name,
                    c.organization_id          as organization,
                    clo.name                   as organization_display_name
             from contact_list_person c
                      left join region r on c.region_id = r.id
                      left join contact_list_organization clo on c.organization_id = clo.id
                      left join organizational_role o on c.organizational_role_code = o.code`
		});

		return contacts.rows;
	},

	addContact: async (db, contact) => {
		const contacts = await db.query({
			text: `insert into contact_list_person(first_name,
																						 last_name,
																						 organizational_role_code,
																						 email,
																						 phone,
																						 region_id,
																						 organization_id)
						 values ($1,
										 $2,
										 $3,
										 $4,
										 $5,
										 $6,
										 $7)

						 returning id;`,
			values: [contact.firstName, contact.lastName, contact.role, contact.email, contact.phone, contact.region, contact.organization]
		});

		return contacts.rows;
	}
};

export default ContactListService;
