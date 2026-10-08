# Run Queries By Iri (Test)

| iri                                                                    | count | label                                                      |
|------------------------------------------------------------------------|-------|------------------------------------------------------------|
| "http://endhealth.info/im#Q_RegisteredGMS"                             | 6479  | Patients registered for GMS services on the reference date |
| "http://endhealth.info/qof#abd9ffb6-891e-4c61-99bd-ce3b70ce4f3e"       | 12    | Patient having unresolved Diabetes code                    |
| "http://smartlifehealth.info/smh#4f227531-005f-4293-99b0-ad35379c4f10" | 12    | DM017 - Patients on Diabetes QOF Register                  |
| "http://smartlifehealth.info/smh#0b42458e-7490-4c43-947b-7276184e79d4" | 45    | 02c. Upload 1of1 NWL CRM 02KCP08 v3.260514 -report         |
| "http://smartlifehealth.info/smh#0b18fbfa-4f42-4070-9101-c197e99b93be" | 3     | DM017a -report                                             |

## Run query for <label>

* Open IMQueryRunner
* Login
* Click "Search and run" button
* Search for <iri> and select <label>
* Click "Add to queue" button
* Click "Run queue" button
* Click "Run" button
* Wait for job to complete
* Click "Refresh" button
* Wait for datatable to finish loading
* Check results for <count>