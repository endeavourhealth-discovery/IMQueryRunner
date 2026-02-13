# Specification

## Add a Job (Query) to the Queue

Currently, the only way to add a query to the queue is via a direct request to the `/queue/job/add` API.

### TODO

- Add queries to the queue through the UI:
  - Add a new page /search
  - Search for a query using a search bar
  - View the query definition (logical view)
  - Click on Run button to add the selected query to the queue
  - Navigate to the queue

## Run a Job (Query)

Currently, SQL is generated in IMAPI with a `:hashcode` placeholder. This placeholder must be replaced with the actual hashcode of the query request.

### TODO

- Implement and test hashcode generation
- Replace `:hashcode` with the generated hashcode during argument resolution

## Get Results

The UI currently displays a list of jobs and their execution status.

### TODO

- Display query results for completed jobs

## Convert IMQ to SQL

Cohort queries and most dataset queries are already being converted to SQL.

### Tasks

- Test the latest IMQ changes, including:
  - `UNION`s
  - Step-based queries
  - `NOT EXISTS` logic
- Test indicator queries

## Testing

Test all APIs for the following actions:
- Add queries to the queue using API endpoints
- Retrieve job status
- Get query results
- Generate SQL from IMQ
