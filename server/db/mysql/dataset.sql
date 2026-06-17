-- DROP SCHEMA dataset;
-- CREATE SCHEMA dataset;
USE dataset;

DROP TABLE IF EXISTS dataset.cohort_results;

DROP TABLE IF EXISTS dataset.dataset_results;

DROP TABLE IF EXISTS dataset.query_result;

DROP TABLE IF EXISTS dataset.indicator_result;

DROP TABLE IF EXISTS dataset.query_result_set;

DROP TABLE IF EXISTS dataset.job;

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
        FOREIGN KEY (query_result_set_id) REFERENCES query_result_set (id),
        FOREIGN KEY (indicator_result_id) REFERENCES indicator_result (id)
    );

CREATE TABLE
    cohort_results (
        query_result_id BIGINT,
        entity_id BIGINT,
        entity_org_id BIGINT,
        FOREIGN KEY (query_result_id) REFERENCES query_result (id)
    );

CREATE TABLE
    dataset_results (
        query_result_id BIGINT,
        entity_id BIGINT,
        column_group VARCHAR(255),
        `json` JSON,
		entity_org_id BIGINT,
        FOREIGN KEY (query_result_id) REFERENCES query_result (id)
    );