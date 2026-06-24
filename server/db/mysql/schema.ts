import { JobStatus } from "~~/enums/JobStatus";

import { type QueryRequest } from "@endeavour/vue-library";

import { sql } from "drizzle-orm";
import { bigint, boolean, date, datetime, decimal, double, index, int, json, text, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mysqlSchema } from "drizzle-orm/mysql-core";

const dataset = mysqlSchema("dataset");
const compass = mysqlSchema("compass");

export const jobTable = dataset.table("job", {
  id: int("id").autoincrement().notNull().primaryKey(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  queryRequests: json("query_requests").$type<QueryRequest[]>().notNull(),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  userId: varchar("user_id", { length: 45 }).notNull(),
  queueDate: datetime("queue_date", { mode: "string" }).notNull(),
  runDate: datetime("run_date", { mode: "string" }).notNull(),
  finishDate: datetime("finish_date", { mode: "string" }),
  status: varchar("status", { length: 45 }).$type<JobStatus>().notNull(),
  error: json("error")
});

export const queryResultSetTable = dataset.table("query_result_set", {
  id: int("id").autoincrement().notNull().primaryKey(),
  startTime: datetime("start_time", { mode: "string" }).notNull(),
  endTime: datetime("end_time", { mode: "string" }),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  searchDate: date("search_date", { mode: "string" }),
  achievementDate: date("achievement_date", { mode: "string" }),
  jobId: int("job_id").notNull()
});

export const indicatorResultTable = dataset.table("indicator_result", {
  id: int("id").autoincrement().notNull().primaryKey(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  queryResultSetId: int("query_result_set_id"),
  searchDate: date("search_date"),
  achievementDate: date("achievement_date"),
  startTime: datetime("start_time", { mode: "string" }),
  endTime: datetime("end_time", { mode: "string" }),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  version: int("version").notNull()
});

export const queryResultTable = dataset.table("query_result", {
  id: int("id").autoincrement().notNull().primaryKey(),
  queryIri: varchar("query_iri", { length: 255 }).notNull(),
  queryResultSetId: int("query_result_set_id"),
  indicatorResultId: int("indicator_result_id"),
  searchDate: date("search_date"),
  achievementDate: date("achievement_date"),
  startTime: datetime("start_time", { mode: "string" }),
  endTime: datetime("end_time", { mode: "string" }),
  startOfDaySnapshot: tinyint("start_of_day_snapshot").notNull(),
  persistent: tinyint("persistent").notNull(),
  useStartOfDaySnapshot: tinyint("use_start_of_day_snapshot").notNull(),
  executedSQL: text("executed_sql"),
  version: int("version").notNull()
});

export const datasetResultsTable = dataset.table("dataset_results", {
  queryResultId: int("query_result_id").notNull(),
  entityId: int("entity_id").notNull(),
  columnGroup: varchar("column_group", { length: 255 }).notNull(),
  json: json("json").notNull(),
  entityOrgId: int("entity_org_id").notNull()
});

export const cohortResultsTable = dataset.table("cohort_results", {
  queryResultId: int("query_result_id").notNull(),
  entityId: int("entity_id").notNull(),
  entityOrgId: int("entity_org_id").notNull()
});

export const allergyIntolerance = compass.table("allergy_intolerance", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  encounterId: bigint("encounter_id", { mode: "number" }),
  practitionerId: bigint("practitioner_id", { mode: "number" }),
  clinicalEffectiveDate: datetime("clinical_effective_date", {
    mode: "string"
  }),
  datePrecisionConceptId: int("date_precision_concept_id"),
  isReview: tinyint("is_review").notNull(),
  coreConceptId: int("core_concept_id"),
  nonCoreConceptId: int("non_core_concept_id"),
  ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
  dateRecorded: datetime("date_recorded", { mode: "string" })
});

export const concept = compass.table(
  "concept",
  {
    dbid: int().autoincrement().notNull().primaryKey(),
    document: int().notNull(),
    id: varchar({ length: 150 }).notNull(),
    draft: tinyint().default(0).notNull(),
    name: varchar({ length: 255 }),
    description: varchar({ length: 400 }),
    scheme: bigint({ mode: "number" }),
    code: varchar({ length: 40 }),
    useCount: bigint("use_count", { mode: "number" }).notNull(),
    updated: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
  },
  table => [index("concept_draft").on(table.draft), unique("concept_id_uq").on(table.id), unique("concept_scheme_code_idx").on(table.scheme, table.code)]
);

export const conceptMap = compass.table(
  "concept_map",
  {
    legacy: int().notNull(),
    core: int().notNull(),
    updated: datetime({ mode: "string" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    id: int().autoincrement().notNull().primaryKey(),
    deleted: tinyint().default(0).notNull()
  },
  table => [unique("concept_map_uq").on(table.legacy, table.deleted, table.updated)]
);

export const conceptSetMember = compass.table(
  "concept_set_member",
  {
    id: int().autoincrement().notNull().primaryKey(),
    set: varchar({ length: 512 }).notNull(),
    member: varchar({ length: 512 }).notNull(),
    im1Id: varchar({ length: 150 }).notNull(),
    self: boolean().default(false).notNull()
  },
  table => [index("idx_set_self").on(table.set, table.self), index("idx_csm").on(table.im1Id, table.self)]
);

export const encounter = compass.table("encounter", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  practitionerId: bigint("practitioner_id", { mode: "number" }),
  appointmentId: bigint("appointment_id", { mode: "number" }),
  clinicalEffectiveDate: datetime("clinical_effective_date", {
    mode: "string"
  }),
  datePrecisionConceptId: int("date_precision_concept_id"),
  episodeOfCareId: bigint("episode_of_care_id", { mode: "number" }),
  serviceProviderOrganizationId: bigint("service_provider_organization_id", {
    mode: "number"
  }),
  coreConceptId: int("core_concept_id"),
  nonCoreConceptId: int("non_core_concept_id"),
  ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
  type: text(),
  subType: text("sub_type"),
  admissionMethod: varchar("admission_method", { length: 40 }),
  endDate: datetime("end_date", { mode: "string" }),
  institutionLocationId: text("institution_location_id"),
  dateRecorded: datetime("date_recorded", { mode: "string" })
});

export const episodeOfCare = compass.table("episode_of_care", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  registrationTypeConceptId: int("registration_type_concept_id"),
  registrationStatusConceptId: int("registration_status_concept_id"),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateRegistered: date("date_registered", { mode: "string" }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateRegisteredEnd: date("date_registered_end", { mode: "string" }),
  usualGpPractitionerId: bigint("usual_gp_practitioner_id", {
    mode: "number"
  })
});

export const medicationOrder = compass.table("medication_order", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  encounterId: bigint("encounter_id", { mode: "number" }),
  practitionerId: bigint("practitioner_id", { mode: "number" }),
  clinicalEffectiveDate: datetime("clinical_effective_date", {
    mode: "string"
  }),
  datePrecisionConceptId: int("date_precision_concept_id"),
  dose: varchar({ length: 1000 }),
  quantityValue: double("quantity_value"),
  quantityUnit: varchar("quantity_unit", { length: 255 }),
  durationDays: int("duration_days"),
  estimatedCost: double("estimated_cost"),
  medicationStatementId: bigint("medication_statement_id", {
    mode: "number"
  }),
  coreConceptId: int("core_concept_id"),
  nonCoreConceptId: int("non_core_concept_id"),
  bnfReference: varchar("bnf_reference", { length: 6 }),
  ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
  issueMethod: text("issue_method"),
  dateRecorded: datetime("date_recorded", { mode: "string" })
});

export const medicationStatement = compass.table("medication_statement", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  encounterId: bigint("encounter_id", { mode: "number" }),
  practitionerId: bigint("practitioner_id", { mode: "number" }),
  clinicalEffectiveDate: datetime("clinical_effective_date", {
    mode: "string"
  }),
  datePrecisionConceptId: int("date_precision_concept_id"),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  cancellationDate: date("cancellation_date", { mode: "string" }),
  dose: varchar({ length: 1000 }),
  quantityValue: double("quantity_value"),
  quantityUnit: varchar("quantity_unit", { length: 255 }),
  authorisationTypeConceptId: int("authorisation_type_concept_id"),
  coreConceptId: int("core_concept_id"),
  nonCoreConceptId: int("non_core_concept_id"),
  bnfReference: varchar("bnf_reference", { length: 6 }),
  ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
  issueMethod: text("issue_method"),
  dateRecorded: datetime("date_recorded", { mode: "string" })
});

export const observation = compass.table(
  "observation",
  {
    id: bigint({ mode: "number" }).notNull().primaryKey(),
    organizationId: bigint("organization_id", { mode: "number" }).notNull(),
    patientId: bigint("patient_id", { mode: "number" }).notNull(),
    personId: bigint("person_id", { mode: "number" }).notNull(),
    encounterId: bigint("encounter_id", { mode: "number" }),
    practitionerId: bigint("practitioner_id", { mode: "number" }),
    clinicalEffectiveDate: datetime("clinical_effective_date", {
      mode: "string"
    }),
    datePrecisionConceptId: int("date_precision_concept_id"),
    resultValue: double("result_value"),
    resultValueUnits: varchar("result_value_units", { length: 50 }),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    resultDate: date("result_date", { mode: "string" }),
    resultText: text("result_text"),
    resultConceptId: int("result_concept_id"),
    isProblem: tinyint("is_problem").notNull(),
    isReview: tinyint("is_review").notNull(),
    // you can use { mode: 'date' }, if you want to have Date as type for this column
    problemEndDate: date("problem_end_date", { mode: "string" }),
    parentObservationId: bigint("parent_observation_id", { mode: "number" }),
    coreConceptId: int("core_concept_id"),
    nonCoreConceptId: int("non_core_concept_id"),
    ageAtEvent: decimal("age_at_event", { precision: 5, scale: 2 }),
    episodicityConceptId: int("episodicity_concept_id"),
    isPrimary: tinyint("is_primary"),
    dateRecorded: datetime("date_recorded", { mode: "string" })
  },
  table => [index("idx_obs").on(table.coreConceptId, table.clinicalEffectiveDate, table.patientId)]
);

export const patient = compass.table("patient", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  title: varchar({ length: 255 }),
  firstNames: varchar("first_names", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  genderConceptId: int("gender_concept_id"),
  nhsNumber: varchar("nhs_number", { length: 255 }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateOfDeath: date("date_of_death", { mode: "string" }),
  currentAddressId: bigint("current_address_id", { mode: "number" }),
  ethnicCodeConceptId: int("ethnic_code_concept_id"),
  registeredPracticeOrganizationId: bigint("registered_practice_organization_id", { mode: "number" })
});

export const patientAddress = compass.table("patient_address", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
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
  startDate: date("start_date", { mode: "string" }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  endDate: date("end_date", { mode: "string" }),
  lsoa2001Code: varchar("lsoa_2001_code", { length: 9 }),
  lsoa2011Code: varchar("lsoa_2011_code", { length: 9 }),
  msoa2001Code: varchar("msoa_2001_code", { length: 9 }),
  msoa2011Code: varchar("msoa_2011_code", { length: 9 }),
  wardCode: varchar("ward_code", { length: 9 }),
  localAuthorityCode: varchar("local_authority_code", { length: 9 }),
  townsendDeprivationIndex: double("townsend_deprivation_index")
});

export const patientContact = compass.table("patient_contact", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  patientId: bigint("patient_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  useConceptId: int("use_concept_id"),
  typeConceptId: int("type_concept_id"),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  startDate: date("start_date", { mode: "string" }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  endDate: date("end_date", { mode: "string" }),
  value: varchar({ length: 255 })
});

export const practitioner = compass.table("practitioner", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  name: varchar({ length: 1024 }),
  roleCode: varchar("role_code", { length: 50 }),
  roleDesc: varchar("role_desc", { length: 255 }),
  gmcCode: varchar("gmc_code", { length: 50 })
});

export const smallPat = compass.table("small_pat", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  organizationId: bigint("organization_id", { mode: "number" }).notNull(),
  personId: bigint("person_id", { mode: "number" }).notNull(),
  title: varchar({ length: 255 }),
  firstNames: varchar("first_names", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  genderConceptId: int("gender_concept_id"),
  nhsNumber: varchar("nhs_number", { length: 255 }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  // you can use { mode: 'date' }, if you want to have Date as type for this column
  dateOfDeath: date("date_of_death", { mode: "string" }),
  currentAddressId: bigint("current_address_id", { mode: "number" }),
  ethnicCodeConceptId: int("ethnic_code_concept_id"),
  registeredPracticeOrganizationId: bigint("registered_practice_organization_id", { mode: "number" })
});

export const organization = compass.table("organization", {
  id: bigint({ mode: "number" }).notNull().primaryKey(),
  odsCode: varchar("ods_code", { length: 50 }),
  name: varchar("name", { length: 255 }),
  typeCode: varchar("type_code", { length: 50 }),
  typeDesc: varchar("type_desc", { length: 255 }),
  postcode: varchar("postcode", { length: 10 }),
  parentOrganizationId: bigint("parent_organization_id", { mode: "number" })
});
