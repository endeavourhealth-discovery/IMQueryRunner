CREATE SCHEMA query_runner; -- uncomment if schema does not exist
CREATE TABLE
  query_runner.job (
    dbid UUID PRIMARY KEY, -- Unique run identifier
    job_name VARCHAR(255) NOT NULL,
    query_request JSONB NOT NULL,
    query_hash VARCHAR(32) NOT NULL,
    query_type VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    queue_date TIMESTAMP NOT NULL,
    run_date TIMESTAMP,
    finish_date TIMESTAMP,
    pid INT, -- Internal (mysql) process ID (for killing)
    status TEXT NOT NULL,
    error TEXT
  );