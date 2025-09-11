import { mysqlTable, primaryKey, bigint, datetime, int, tinyint, boolean, decimal, index, unique, varchar, text, date, double } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const allergyIntolerance = mysqlTable("allergy_intolerance", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	encounterId: bigint("encounter_id", { mode: "number" }),
	practitionerId: bigint("practitioner_id", { mode: "number" }),
	clinicalEffectiveDate: datetime("clinical_effective_date", { mode: 'string'}),
	datePrecisionConceptId: int("date_precision_concept_id"),
	isReview: tinyint("is_review").notNull(),
	coreConceptId: int("core_concept_id"),
	nonCoreConceptId: int("non_core_concept_id"),
	ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
	dateRecorded: datetime("date_recorded", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "allergy_intolerance_id"}),
]);

export const concept = mysqlTable("concept", {
	dbid: int().autoincrement().notNull(),
	document: int().notNull(),
	id: varchar({ length: 150 }).notNull(),
	draft: tinyint().default(0).notNull(),
	name: varchar({ length: 255 }),
	description: varchar({ length: 400 }),
	scheme: bigint({ mode: "number" }),
	code: varchar({ length: 40 }),
	useCount: bigint("use_count", { mode: "number" }).notNull(),
	updated: datetime({ mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
},
(table) => [
	index("concept_draft").on(table.draft),
	primaryKey({ columns: [table.dbid], name: "concept_dbid"}),
	unique("concept_id_uq").on(table.id),
	unique("concept_scheme_code_idx").on(table.scheme, table.code),
]);

export const conceptMap = mysqlTable("concept_map", {
	legacy: int().notNull(),
	core: int().notNull(),
	updated: datetime({ mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
	id: int().autoincrement().notNull(),
	deleted: tinyint().default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "concept_map_id"}),
	unique("concept_map_uq").on(table.legacy, table.deleted, table.updated),
]);

export const conceptSetMember = mysqlTable("concept_set_member", {
	id: int().autoincrement().notNull(),
	set: varchar({ length: 512 }).notNull(),
	member: varchar({ length: 512 }).notNull(),
	im1Id: varchar({ length: 150 }).notNull(),
  self: boolean().default(false).notNull(),
},
(table) => [
	index("idx_set_self").on(table.set, table.self),
	index("idx_csm").on(table.im1Id, table.self),
	primaryKey({ columns: [table.id], name: "concept_set_member_id"}),
]);

export const encounter = mysqlTable("encounter", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	practitionerId: bigint("practitioner_id", { mode: "number" }),
	appointmentId: bigint("appointment_id", { mode: "number" }),
	clinicalEffectiveDate: datetime("clinical_effective_date", { mode: 'string'}),
	datePrecisionConceptId: int("date_precision_concept_id"),
	episodeOfCareId: bigint("episode_of_care_id", { mode: "number" }),
	serviceProviderOrganizationId: bigint("service_provider_organization_id", { mode: "number" }),
	coreConceptId: int("core_concept_id"),
	nonCoreConceptId: int("non_core_concept_id"),
	ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
	type: text(),
	subType: text("sub_type"),
	admissionMethod: varchar("admission_method", { length: 40 }),
	endDate: datetime("end_date", { mode: 'string'}),
	institutionLocationId: text("institution_location_id"),
	dateRecorded: datetime("date_recorded", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "encounter_id"}),
]);

export const episodeOfCare = mysqlTable("episode_of_care", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	registrationTypeConceptId: int("registration_type_concept_id"),
	registrationStatusConceptId: int("registration_status_concept_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateRegistered: date("date_registered", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateRegisteredEnd: date("date_registered_end", { mode: 'string' }),
	usualGpPractitionerId: bigint("usual_gp_practitioner_id", { mode: "number" }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "episode_of_care_id"}),
]);

export const medicationOrder = mysqlTable("medication_order", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	encounterId: bigint("encounter_id", { mode: "number" }),
	practitionerId: bigint("practitioner_id", { mode: "number" }),
	clinicalEffectiveDate: datetime("clinical_effective_date", { mode: 'string'}),
	datePrecisionConceptId: int("date_precision_concept_id"),
	dose: varchar({ length: 1000 }),
	quantityValue: double("quantity_value"),
	quantityUnit: varchar("quantity_unit", { length: 255 }),
	durationDays: int("duration_days"),
	estimatedCost: double("estimated_cost"),
	medicationStatementId: bigint("medication_statement_id", { mode: "number" }),
	coreConceptId: int("core_concept_id"),
	nonCoreConceptId: int("non_core_concept_id"),
	bnfReference: varchar("bnf_reference", { length: 6 }),
	ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
	issueMethod: text("issue_method"),
	dateRecorded: datetime("date_recorded", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "medication_order_id"}),
]);

export const medicationStatement = mysqlTable("medication_statement", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	encounterId: bigint("encounter_id", { mode: "number" }),
	practitionerId: bigint("practitioner_id", { mode: "number" }),
	clinicalEffectiveDate: datetime("clinical_effective_date", { mode: 'string'}),
	datePrecisionConceptId: int("date_precision_concept_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	cancellationDate: date("cancellation_date", { mode: 'string' }),
	dose: varchar({ length: 1000 }),
	quantityValue: double("quantity_value"),
	quantityUnit: varchar("quantity_unit", { length: 255 }),
	authorisationTypeConceptId: int("authorisation_type_concept_id"),
	coreConceptId: int("core_concept_id"),
	nonCoreConceptId: int("non_core_concept_id"),
	bnfReference: varchar("bnf_reference", { length: 6 }),
	ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
	issueMethod: text("issue_method"),
	dateRecorded: datetime("date_recorded", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "medication_statement_id"}),
]);

export const observation = mysqlTable("observation", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	encounterId: bigint("encounter_id", { mode: "number" }),
	practitionerId: bigint("practitioner_id", { mode: "number" }),
	clinicalEffectiveDate: datetime("clinical_effective_date", { mode: 'string'}),
	datePrecisionConceptId: int("date_precision_concept_id"),
	resultValue: double("result_value"),
	resultValueUnits: varchar("result_value_units", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	resultDate: date("result_date", { mode: 'string' }),
	resultText: text("result_text"),
	resultConceptId: int("result_concept_id"),
	isProblem: tinyint("is_problem").notNull(),
	isReview: tinyint("is_review").notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	problemEndDate: date("problem_end_date", { mode: 'string' }),
	parentObservationId: bigint("parent_observation_id", { mode: "number" }),
	coreConceptId: int("core_concept_id"),
	nonCoreConceptId: int("non_core_concept_id"),
	ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
	episodicityConceptId: int("episodicity_concept_id"),
	isPrimary: tinyint("is_primary"),
	dateRecorded: datetime("date_recorded", { mode: 'string'}),
},
(table) => [
	index("idx_obs").on(table.coreConceptId, table.clinicalEffectiveDate, table.patientId),
	primaryKey({ columns: [table.id], name: "observation_id"}),
]);

export const patient = mysqlTable("patient", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }),
	firstNames: varchar("first_names", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	genderConceptId: int("gender_concept_id"),
	nhsNumber: varchar("nhs_number", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfBirth: date("date_of_birth", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfDeath: date("date_of_death", { mode: 'string' }),
	currentAddressId: bigint("current_address_id", { mode: "number" }),
	ethnicCodeConceptId: int("ethnic_code_concept_id"),
	registeredPracticeOrganizationId: bigint("registered_practice_organization_id", { mode: "number" }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "patient_id"}),
]);

export const patientAddress = mysqlTable("patient_address", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	addressLine1: varchar("address_line_1", { length: 255 }),
	addressLine2: varchar("address_line_2", { length: 255 }),
	addressLine3: varchar("address_line_3", { length: 255 }),
	addressLine4: varchar("address_line_4", { length: 255 }),
	city: varchar({ length: 255 }),
	postcode: varchar({ length: 255 }),
	useConceptId: int("use_concept_id").notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	lsoa2001Code: varchar("lsoa_2001_code", { length: 9 }),
	lsoa2011Code: varchar("lsoa_2011_code", { length: 9 }),
	msoa2001Code: varchar("msoa_2001_code", { length: 9 }),
	msoa2011Code: varchar("msoa_2011_code", { length: 9 }),
	wardCode: varchar("ward_code", { length: 9 }),
	localAuthorityCode: varchar("local_authority_code", { length: 9 }),
	townsendDeprivationIndex: double("townsend_deprivation_index"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "patient_address_id"}),
]);

export const patientContact = mysqlTable("patient_contact", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	patientId: bigint("patient_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	useConceptId: int("use_concept_id"),
	typeConceptId: int("type_concept_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	value: varchar({ length: 255 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "patient_contact_id"}),
]);

export const practitioner = mysqlTable("practitioner", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	name: varchar({ length: 1024 }),
	roleCode: varchar("role_code", { length: 50 }),
	roleDesc: varchar("role_desc", { length: 255 }),
	gmcCode: varchar("gmc_code", { length: 50 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "practitioner_id"}),
]);

export const smallPat = mysqlTable("small_pat", {
	id: bigint({ mode: "number" }).notNull(),
	organizationId: bigint("organization_id", { mode: "number" }).notNull(),
	personId: bigint("person_id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }),
	firstNames: varchar("first_names", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	genderConceptId: int("gender_concept_id"),
	nhsNumber: varchar("nhs_number", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfBirth: date("date_of_birth", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfDeath: date("date_of_death", { mode: 'string' }),
	currentAddressId: bigint("current_address_id", { mode: "number" }),
	ethnicCodeConceptId: int("ethnic_code_concept_id"),
	registeredPracticeOrganizationId: bigint("registered_practice_organization_id", { mode: "number" }),
});
