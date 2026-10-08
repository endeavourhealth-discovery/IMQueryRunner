-- Adds the indexes the application relies on to an EXISTING dataset schema (dataset.sql already creates them on a fresh install).
-- MySQL has no CREATE INDEX IF NOT EXISTS: check first, and skip any that already exist.
--
--   SELECT table_name, index_name FROM information_schema.statistics
--   WHERE table_schema = 'dataset' AND index_name IN ('idx_job_user_queue_date', 'idx_query_result_set_iri', 'idx_patient_exists_iri_patient');
--
-- Not needed: the foreign keys in dataset.sql already give InnoDB an index on query_result.query_result_set_id, query_result_set.job_id,
-- cohort_results.query_result_id, dataset_results.query_result_id and indicator_result.query_result_set_id.
-- Run during a quiet period; INPLACE/NONE keeps the tables readable and writable while the index builds.

-- Job list: WHERE user_id = ? [AND queue_date <= ?] ORDER BY queue_date DESC
ALTER TABLE dataset.job ADD INDEX idx_job_user_queue_date (user_id, queue_date), ALGORITHM = INPLACE, LOCK = NONE;

-- Result lookup and cache check: WHERE query_result_set_id = ? AND query_iri = ?
ALTER TABLE dataset.query_result ADD INDEX idx_query_result_set_iri (query_result_set_id, query_iri), ALGORITHM = INPLACE, LOCK = NONE;

-- Debug queries: WHERE query_iri = ? AND patient_id = ?
ALTER TABLE dataset.patient_exists ADD INDEX idx_patient_exists_iri_patient (query_iri, patient_id), ALGORITHM = INPLACE, LOCK = NONE;

-- Rollback
-- ALTER TABLE dataset.job DROP INDEX idx_job_user_queue_date;
-- ALTER TABLE dataset.query_result DROP INDEX idx_query_result_set_iri;
-- ALTER TABLE dataset.patient_exists DROP INDEX idx_patient_exists_iri_patient;
