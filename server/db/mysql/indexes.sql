CREATE INDEX idx_registration_type_concept_id ON compass.episode_of_care(registration_type_concept_id);
-- ALTER TABLE compass.episode_of_care DROP INDEX idx_registration_type_concept_id;
CREATE UNIQUE INDEX idx_cohort_query_entity ON dataset.cohort_results (query_result_id, entity_id);
-- ALTER TABLE dataset.cohort_results DROP INDEX idx_cohort_query_entity;
CREATE INDEX idx_date_of_birth ON compass.patient(date_of_birth);
-- ALTER TABLE compass.patient DROP INDEX idx_date_of_birth;

CREATE INDEX idx_obs_patient_date ON observation (patient_id, clinical_effective_date DESC);
CREATE INDEX idx_obs_concept_date ON observation (core_concept_id, clinical_effective_date DESC);