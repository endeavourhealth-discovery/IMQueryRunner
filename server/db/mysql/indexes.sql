CREATE INDEX idx_registration_type_concept_id ON compass.episode_of_care(registration_type_concept_id);
-- ALTER TABLE compass.episode_of_care DROP INDEX idx_registration_type_concept_id;
CREATE INDEX idx_cohort_query_entity ON cohort_results (query_result_id, entity_id);