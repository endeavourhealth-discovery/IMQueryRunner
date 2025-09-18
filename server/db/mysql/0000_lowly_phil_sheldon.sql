-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `allergy_intolerance` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`encounter_id` bigint,
	`practitioner_id` bigint,
	`clinical_effective_date` datetime,
	`date_precision_concept_id` int,
	`is_review` tinyint(1) NOT NULL,
	`core_concept_id` int,
	`non_core_concept_id` int,
	`age_at_event` decimal(5,2),
	`date_recorded` datetime,
	CONSTRAINT `allergy_intolerance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `concept` (
	`dbid` int AUTO_INCREMENT NOT NULL,
	`document` int NOT NULL,
	`id` varchar(150) NOT NULL,
	`draft` tinyint(1) NOT NULL DEFAULT 0,
	`name` varchar(255),
	`description` varchar(400),
	`scheme` bigint,
	`code` varchar(40),
	`use_count` bigint NOT NULL DEFAULT 0,
	`updated` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `concept_dbid` PRIMARY KEY(`dbid`),
	CONSTRAINT `concept_id_uq` UNIQUE(`id`),
	CONSTRAINT `concept_scheme_code_idx` UNIQUE(`scheme`,`code`)
);
--> statement-breakpoint
CREATE TABLE `concept_map` (
	`legacy` int NOT NULL,
	`core` int NOT NULL,
	`updated` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`id` int AUTO_INCREMENT NOT NULL,
	`deleted` tinyint(1) NOT NULL DEFAULT 0,
	CONSTRAINT `concept_map_id` PRIMARY KEY(`id`),
	CONSTRAINT `concept_map_uq` UNIQUE(`legacy`,`deleted`,`updated`)
);
--> statement-breakpoint
CREATE TABLE `concept_set_member` (
	`id` int AUTO_INCREMENT NOT NULL,
	`set` varchar(512) NOT NULL,
	`member` varchar(512) NOT NULL,
	`im1id` varchar(150) NOT NULL,
	`self` bit(1),
	CONSTRAINT `concept_set_member_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `encounter` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`practitioner_id` bigint,
	`appointment_id` bigint,
	`clinical_effective_date` datetime,
	`date_precision_concept_id` int,
	`episode_of_care_id` bigint,
	`service_provider_organization_id` bigint,
	`core_concept_id` int,
	`non_core_concept_id` int,
	`age_at_event` decimal(5,2),
	`type` text,
	`sub_type` text,
	`admission_method` varchar(40),
	`end_date` datetime,
	`institution_location_id` text,
	`date_recorded` datetime,
	CONSTRAINT `encounter_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `episode_of_care` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`registration_type_concept_id` int,
	`registration_status_concept_id` int,
	`date_registered` date,
	`date_registered_end` date,
	`usual_gp_practitioner_id` bigint,
	CONSTRAINT `episode_of_care_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medication_order` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`encounter_id` bigint,
	`practitioner_id` bigint,
	`clinical_effective_date` datetime,
	`date_precision_concept_id` int,
	`dose` varchar(1000),
	`quantity_value` double,
	`quantity_unit` varchar(255),
	`duration_days` int,
	`estimated_cost` double,
	`medication_statement_id` bigint,
	`core_concept_id` int,
	`non_core_concept_id` int,
	`bnf_reference` varchar(6),
	`age_at_event` decimal(5,2),
	`issue_method` text,
	`date_recorded` datetime,
	CONSTRAINT `medication_order_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medication_statement` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`encounter_id` bigint,
	`practitioner_id` bigint,
	`clinical_effective_date` datetime,
	`date_precision_concept_id` int,
	`cancellation_date` date,
	`dose` varchar(1000),
	`quantity_value` double,
	`quantity_unit` varchar(255),
	`authorisation_type_concept_id` int,
	`core_concept_id` int,
	`non_core_concept_id` int,
	`bnf_reference` varchar(6),
	`age_at_event` decimal(5,2),
	`issue_method` text,
	`date_recorded` datetime,
	CONSTRAINT `medication_statement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observation` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`encounter_id` bigint,
	`practitioner_id` bigint,
	`clinical_effective_date` datetime,
	`date_precision_concept_id` int,
	`result_value` double,
	`result_value_units` varchar(50),
	`result_date` date,
	`result_text` text,
	`result_concept_id` int,
	`is_problem` tinyint(1) NOT NULL,
	`is_review` tinyint(1) NOT NULL,
	`problem_end_date` date,
	`parent_observation_id` bigint,
	`core_concept_id` int,
	`non_core_concept_id` int,
	`age_at_event` decimal(5,2),
	`episodicity_concept_id` int,
	`is_primary` tinyint(1),
	`date_recorded` datetime,
	CONSTRAINT `observation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`title` varchar(255),
	`first_names` varchar(255),
	`last_name` varchar(255),
	`gender_concept_id` int,
	`nhs_number` varchar(255),
	`date_of_birth` date,
	`date_of_death` date,
	`current_address_id` bigint,
	`ethnic_code_concept_id` int,
	`registered_practice_organization_id` bigint,
	CONSTRAINT `patient_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_address` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`address_line_1` varchar(255),
	`address_line_2` varchar(255),
	`address_line_3` varchar(255),
	`address_line_4` varchar(255),
	`city` varchar(255),
	`postcode` varchar(255),
	`use_concept_id` int NOT NULL,
	`start_date` date,
	`end_date` date,
	`lsoa_2001_code` varchar(9),
	`lsoa_2011_code` varchar(9),
	`msoa_2001_code` varchar(9),
	`msoa_2011_code` varchar(9),
	`ward_code` varchar(9),
	`local_authority_code` varchar(9),
	`townsend_deprivation_index` double,
	CONSTRAINT `patient_address_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_contact` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`patient_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`use_concept_id` int,
	`type_concept_id` int,
	`start_date` date,
	`end_date` date,
	`value` varchar(255),
	CONSTRAINT `patient_contact_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `practitioner` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`name` varchar(1024),
	`role_code` varchar(50),
	`role_desc` varchar(255),
	`gmc_code` varchar(50),
	CONSTRAINT `practitioner_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `small_pat` (
	`id` bigint NOT NULL,
	`organization_id` bigint NOT NULL,
	`person_id` bigint NOT NULL,
	`title` varchar(255),
	`first_names` varchar(255),
	`last_name` varchar(255),
	`gender_concept_id` int,
	`nhs_number` varchar(255),
	`date_of_birth` date,
	`date_of_death` date,
	`current_address_id` bigint,
	`ethnic_code_concept_id` int,
	`registered_practice_organization_id` bigint
);
--> statement-breakpoint
CREATE INDEX `concept_draft` ON `concept` (`draft`);--> statement-breakpoint
CREATE INDEX `idx_set_self` ON `concept_set_member` (`set`,`self`);--> statement-breakpoint
CREATE INDEX `idx_csm` ON `concept_set_member` (`im1id`,`self`);--> statement-breakpoint
CREATE INDEX `idx_obs` ON `observation` (`core_concept_id`,`clinical_effective_date`,`patient_id`);
*/