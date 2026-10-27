-- DROP SCHEMA dataset;
-- CREATE SCHEMA dataset;
USE dataset;

DROP TABLE IF EXISTS dataset.cohort_results;

DROP TABLE IF EXISTS dataset.dataset_results;

DROP TABLE IF EXISTS dataset.query_dependency;

DROP TABLE IF EXISTS dataset.query_result;

DROP TABLE IF EXISTS dataset.indicator_result;

DROP TABLE IF EXISTS dataset.query_result_set;

DROP TABLE IF EXISTS dataset.job;

DROP TABLE IF EXISTS dataset.patient_exists;

CREATE TABLE
    job (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        job_name VARCHAR(255),
        query_requests JSON,
        start_of_day_snapshot BIT (1),
        persistent BIT (1),
        use_start_of_day_snapshot BIT (1),
        user_id VARCHAR(45),
        queue_date DATETIME,
        run_date DATETIME,
        finish_date DATETIME,
        `status` VARCHAR(45),
        `error` JSON
    );

CREATE TABLE
    query_result_set (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        start_time DATETIME,
        end_time DATETIME,
        start_of_day_snapshot BIT (1),
        persistent BIT (1),
        use_start_of_day_snapshot BIT (1),
        job_id BIGINT,
        user_id VARCHAR(45),
        query_iri VARCHAR(100),
        search_date DATE,
        achievement_date DATE,
        FOREIGN KEY (job_id) REFERENCES job (id)
    );

CREATE TABLE
    indicator_result (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        query_iri VARCHAR(255),
        query_result_set_id BIGINT,
        search_date DATE,
        achievement_date DATE,
        start_time DATETIME,
        end_time DATETIME,
        start_of_day_snapshot BIT (1),
        persistent BIT (1),
        use_start_of_day_snapshot BIT (1),
        version BIGINT,
        FOREIGN KEY (query_result_set_id) REFERENCES query_result_set (id)
    );

CREATE TABLE
    query_result (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        query_iri VARCHAR(255),
        query_result_set_id BIGINT,
        indicator_result_id BIGINT,
        search_date DATE,
        achievement_date DATE,
        start_time DATETIME,
        end_time DATETIME,
        start_of_day_snapshot BIT (1),
        persistent BIT (1),
        use_start_of_day_snapshot BIT (1),
        version BIGINT,
        executed_sql MEDIUMTEXT,
        FOREIGN KEY (query_result_set_id) REFERENCES query_result_set (id),
        FOREIGN KEY (indicator_result_id) REFERENCES indicator_result (id),
        query_type VARCHAR(255)
    );

CREATE TABLE
    query_dependency (
        parent_query_result_id BIGINT NOT NULL,
        sub_query_result_id BIGINT NOT NULL,
        PRIMARY KEY (parent_query_result_id, sub_query_result_id),
        INDEX idx_query_dependency_sub (sub_query_result_id),
        FOREIGN KEY (parent_query_result_id) REFERENCES query_result (id),
        FOREIGN KEY (sub_query_result_id) REFERENCES query_result (id)
    );

CREATE TABLE
    cohort_results (
        query_result_id BIGINT,
        entity_id BIGINT,
        entity_org_id BIGINT,
        INDEX idx_qr_entity (query_result_id, entity_id),
        FOREIGN KEY (query_result_id) REFERENCES query_result (id)
    );

CREATE TABLE
    dataset_results (
        query_result_id BIGINT,
        entity_id BIGINT,
        column_group VARCHAR(255),
        `json` JSON,
		entity_org_id BIGINT,
        INDEX idx_qr_entity (query_result_id, entity_id),
        FOREIGN KEY (query_result_id) REFERENCES query_result (id)
    );

CREATE TABLE patient_exists (
    query_iri VARCHAR(512) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    step_no INT NOT NULL,
    cte_name VARCHAR(128) NOT NULL,
    patient_found TINYINT NOT NULL
);

CREATE INDEX idx_job_user_queue_date ON dataset.job (user_id, queue_date);
CREATE INDEX idx_query_result_set_iri ON dataset.query_result (query_result_set_id, query_iri);
CREATE INDEX idx_patient_exists_iri_patient ON dataset.patient_exists (query_iri, patient_id);

-- cohort_results and dataset_results carry a NON-unique idx_qr_entity (query_result_id, entity_id) (see CREATE TABLE above). It makes
-- "WHERE query_result_id = ?" lookups covering for entity_id, and serves the entity_id joins in the generated indicator SQL. The unique
-- version below stays disabled: the generated SQL can legitimately insert the same entity more than once for a query (for example when its
-- last step is observation-rooted), which a unique index would reject.
-- ALTER TABLE dataset.cohort_results DROP INDEX idx_cohort_query_entity;
-- CREATE UNIQUE INDEX idx_cohort_query_entity ON dataset.cohort_results (query_result_id, entity_id);

-- ALTER TABLE compass.episode_of_care DROP INDEX idx_registration_type_concept_id;
-- CREATE INDEX idx_registration_type_concept_id ON compass.episode_of_care(registration_type_concept_id);

-- ALTER TABLE compass.patient DROP INDEX idx_date_of_birth;
-- CREATE INDEX idx_date_of_birth ON compass.patient(date_of_birth);

-- ---------------------------------------------------------------------------------------------------------------------------------
-- EXISTING DATABASES. This script DROPS and recreates the dataset tables, so never run it against live data. To bring a live database
-- in line with it, run the statements below instead (each one only if the index is missing: SHOW INDEX FROM dataset.<table>).
-- Test on a copy first. InnoDB builds these indexes online, but time it on a large table.
-- ---------------------------------------------------------------------------------------------------------------------------------

-- Covering lookup of results by query. The new index is added before the old one is dropped in the same statement, because the
-- foreign key on query_result_id needs an index that starts with that column. `query_result_id` is the index MySQL created for the FK.
-- ALTER TABLE dataset.cohort_results ADD INDEX idx_qr_entity (query_result_id, entity_id), DROP INDEX query_result_id;
-- ALTER TABLE dataset.dataset_results ADD INDEX idx_qr_entity (query_result_id, entity_id), DROP INDEX query_result_id;

-- The indexes defined near the top of this file, if a live database does not have them (check `SHOW INDEX` first):
-- CREATE INDEX idx_job_user_queue_date ON dataset.job (user_id, queue_date);
-- CREATE INDEX idx_query_result_set_iri ON dataset.query_result (query_result_set_id, query_iri);
-- ALTER TABLE dataset.query_result DROP INDEX query_result_set_id;  -- now redundant: idx_query_result_set_iri starts with the same column

-- dataset.concept_tct is built outside this repository. These are the indexes in use on the live database, recorded so they are not lost:
--   PRIMARY (dbid)
--   idx_set_self (parent, self)
--   idx_csm (im1dbid, self)
--   concept_tct (im1dbid, parent)
-- Under review, not yet applied (see docs/IMQtoSQL-sql-baseline.md in the IMAPI repository): a single (im1dbid, parent, self) to replace
-- idx_csm and concept_tct, and (parent, self, im1dbid) in place of idx_set_self. Confirm the live plan first. The generated SQL joins
-- on im1dbid and filters on parent (and often self), and `parent` is a long VARCHAR(512) IRI, so these indexes are large.
