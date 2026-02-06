-- CREATE SCHEMA query_runner; -- uncomment if schema does not exist

CREATE TABLE
  query_runner.job (
    id UUID PRIMARY KEY, -- Unique run identifier
    job_name VARCHAR(255) NOT NULL,
    query_iri VARCHAR(255) NOT NULL,
    query_request JSONB NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    queued_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    pid INT, -- Internal (postgres) process ID (for killing)
    stopped_at TIMESTAMP,
    status TEXT,
    error TEXT
  );