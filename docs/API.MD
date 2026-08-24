# IMQueryRunner API Documentation

This document outlines the RESTful APIs exposed by the Nuxt server layer. Endpoints are auto-routed based on the `server/api/` directory structure.

> **🔐 Authentication Note:** Most endpoints under `/api/imapi/`, `/api/queue/`, and `/api/user/` require an active session. Authentication is handled via the `session_id` cookie. Public endpoints are explicitly marked.

---

## 🔑 Authentication (`/api/auth/`)
Handles user sessions, login flows, and permission checks via the Endeavour Security host.

| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/auth/getLoginUrl` | Retrieves the OAuth login URL | `redirectUri`, `state` (Query) |
| `GET` | `/api/auth/getProfileUrl` | Retrieves the user profile URL | *(None)* |
| `POST` | `/api/auth/hasPermission` | Checks if the current session has a specific permission | `permission` (Body) |
| `GET` | `/api/auth/isLoggedIn` | Checks if the current session is valid | `session_id` (Cookie) |
| `GET` | `/api/auth/login` | Exchanges OAuth code for a session & user object | `code`, `state` (Query) |
| `GET` | `/api/auth/logout` | Destroys the current session cookie | `session_id` (Cookie) |
| `GET` | `/api/auth/machineLogin` | Authenticates a machine/service account | `clientId`, `clientSecret` (Query) |
| `POST` | `/api/auth/updateUser` | Updates user profile data | `User` object (Body) |
| `GET` | `/api/auth/user` | Fetches the current authenticated user | `session_id` (Cookie) |

---

## 👤 User Preferences (`/api/user/`)
Manages frontend UI preferences and user-specific settings. Requires authentication.

| Method | Path | Description | Body / Parameters |
|:---|:---|:---|:---|
| `POST` | `/api/user/darkMode` | Toggle dark mode | `{ bool: boolean }` |
| `POST` | `/api/user/favourites` | Update favourite entities | `string[]` (Array of IRIs) |
| `POST` | `/api/user/fontSize` | Update UI font size | `{ fontSize: FontSize }` |
| `POST` | `/api/user/namespaces` | Update namespace read/write permissions | `NamespacePermission[]` |
| `POST` | `/api/user/organisations` | Update user organisations | `string[]` (Array of Org IRIs) |
| `POST` | `/api/user/preset` | Update PrimeVue preset theme | `{ theme: PrimeVuePresetThemes }` |
| `POST` | `/api/user/primaryColor` | Update primary UI color | `{ color: PrimeVueColors }` |
| `POST` | `/api/user/recentActivity` | Update recent activity history | `RecentActivityItemDto[]` |
| `POST` | `/api/user/surfaceColor` | Update surface UI color | `{ color: PrimeVueColors }` |

---

## 🧠 Information Model API (`/api/imapi/`)
Proxies and extends the core IM API. All endpoints require `session_id` cookie.

### 📦 Concept
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/concept/contextMaps` | Get context maps for an entity | `iri` (Query) |
| `GET` | `/api/imapi/concept/entityTermCodes` | Get term codes for an entity | `iri`, `includeInactive` (Query) |
| `GET` | `/api/imapi/concept/matchedFrom` | Get matched-from mappings | `iri` (Query) |
| `GET` | `/api/imapi/concept/matchedTo` | Get matched-to mappings | `iri` (Query) |

### 🏗️ Data Model
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/dataModel/UIPropertyForQB` | Get UI property for Query Builder | `dmIri`, `propIri` (Query) |
| `GET` | `/api/imapi/dataModel/checkPropertyType` | Check the type of a property | `iri` (Query) |
| `GET` | `/api/imapi/dataModel/dataModelProperties` | Get properties of a data model | `iri`, `pathsOnly` (Query) |
| `GET` | `/api/imapi/dataModel/dataModelPropertiesWithValueType` | Get properties filtered by value type | `iris` (comma-separated), `valueType` (Query) |
| `GET` | `/api/imapi/dataModel/dataModels` | Get data models containing a property | `propIri` (Query) |
| `GET` | `/api/imapi/dataModel/propertiesDisplay` | Get display metadata for a property | `iri` (Query) |

### 🔍 ECL (Entity Constraint Language)
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `POST` | `/api/imapi/ecl/ecl` | Convert a query object to ECL string | `query` (Body) |
| `POST` | `/api/imapi/ecl/eclFromEcl` | Parse/validate ECL string with names | `ecl`, `showNames`, `status` (Body) |
| `POST` | `/api/imapi/ecl/eclFromQuery` | Convert query to ECL with optional names | `query`, `showNames` (Body) |
| `POST` | `/api/imapi/ecl/eclSearch` | Search entities using ECL | `eclSearchRequest` (Body) |
| `GET` | `/api/imapi/ecl/isValidPropertyForDomains` | Validate property against domains | `propertyIri`, `conceptIri` (Query) |
| `GET` | `/api/imapi/ecl/propertiesForDomains` | Get valid properties for domains | `conceptIri` (Query) |
| `POST` | `/api/imapi/ecl/queryFromEcl` | Parse ECL string into a query object | `ecl` (Body) |
| `GET` | `/api/imapi/ecl/rangesForProperty` | Get allowed value ranges for a property | `propertyIri` (Query) |
| `POST` | `/api/imapi/ecl/validateEcl` | Validate an ECL string | `ecl`, `showNames` (Body) |
| `POST` | `/api/imapi/ecl/validateModelFromECL` | Validate data model using ECL | `ecl`, `showNames` (Body) |
| `POST` | `/api/imapi/ecl/validateModelFromQuery` | Validate data model using query object | `query` (Body) |

### 🌳 Entity
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/entity/allowableChildTypes` | Get allowable child types for an entity | `iri` (Query) |
| `GET` | `/api/imapi/entity/asEntityReferenceNode` | Get entity formatted as a reference node | `iri` (Query) |
| `GET` | `/api/imapi/entity/asEntityReferenceNodes` | Get multiple entities as reference nodes | `iris` (comma-separated) (Query) |
| `GET` | `/api/imapi/entity/bundleByPredicateExclusions` | Get entity bundle excluding predicates | `iri`, `predicates` (Query) |
| `GET` | `/api/imapi/entity/children` | Get direct children of an entity | `iri`, `schemeIris` (Query) |
| `GET` | `/api/imapi/entity/childrenPaged` | Get paginated children with filters | `iri`, `page`, `size`, `schemeIris`, `typeFilter` (Query) |
| `GET` | `/api/imapi/entity/downloadEntity` | Download full entity data | `iri` (Query) |
| `POST` | `/api/imapi/entity/downloadSearchResults` | Download search results in various formats | `queryRequest`/`eclSearchRequest`, `format`, `include*` flags (Body) |
| `GET` | `/api/imapi/entity/entityByPredicateExclusions` | Get entity data excluding specific predicates | `iri`, `predicates` (Query) |
| `GET` | `/api/imapi/entity/entityExists` | Check if an entity IRI exists | `iri` (Query) |
| `GET` | `/api/imapi/entity/filterDefaults` | Get default filter options | *(None)* |
| `GET` | `/api/imapi/entity/filterOptions` | Get available filter options | *(None)* |
| `GET` | `/api/imapi/entity/folderPath` | Get the hierarchical folder path for an entity | `iri` (Query) |
| `GET` | `/api/imapi/entity/graph` | Get entity formatted as an organization chart graph | `iri` (Query) |
| `GET` | `/api/imapi/entity/history` | Get provenance history | `iri` (Query) |
| `GET` | `/api/imapi/entity/namespaces` | Get available namespaces | *(None)* |
| `GET` | `/api/imapi/entity/parents` | Get parent entities | `iri`, `schemeIris` (Query) |
| `GET` | `/api/imapi/entity/partial` | Get partial entity data by predicates | `iri`, `predicates` (Query) |
| `GET` | `/api/imapi/entity/partialAndTotalCount` | Get paginated partial entity data | `iri`, `predicate`, `page`, `size`, `schemeIris` (Query) |
| `GET` | `/api/imapi/entity/partialBundle` | Get partial entity as a bundle | `iri`, `predicates` (Query) |
| `POST` | `/api/imapi/entity/partials` | Batch fetch partial entities | `typeIris[]`, `predicates[]` (Body) |
| `GET` | `/api/imapi/entity/shortestParentHierarchy` | Get shortest path between ancestor & descendant | `descendant`, `ancestor` (Query) |
| `GET` | `/api/imapi/entity/summary` | Get entity summary | `iri` (Query) |
| `GET` | `/api/imapi/entity/usages` | Get paginated entity usages | `iri`, `page`, `size` (Query) |
| `GET` | `/api/imapi/entity/usagesTotalRecords` | Get total count of entity usages | `iri` (Query) |
| `POST` | `/api/imapi/entity/validate` | Validate an entity against a schema | `validationIri`, `entity` (Body) |

### 📁 Filer
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/filer/deltas/download` | Download change deltas | *(None)* |
| `GET` | `/api/imapi/filer/file/document/:taskId` | Get document filing task progress | `taskId` (Path) |
| `POST` | `/api/imapi/filer/file/document` | File a document of entities | `document` (Body) |
| `POST` | `/api/imapi/filer/file/entity` | File a single entity | `entity`, `namespace`, `crud` (Body) |
| `POST` | `/api/imapi/filer/folder/add` | Add entity to a folder | `entity`, `folder` (Body) |
| `POST` | `/api/imapi/filer/folder/create` | Create a new folder | `container`, `name` (Body) |
| `POST` | `/api/imapi/filer/folder/move` | Move entity between folders | `entity`, `oldFolder`, `newFolder` (Body) |

### 🐙 GitHub
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/github/allReleases` | Get all releases for a repository | `repositoryName` (Query) |
| `GET` | `/api/imapi/github/latestRelease` | Get latest release for a repository | `repositoryName` (Query) |

### 🔎 Query
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `POST` | `/api/imapi/query/askQueryIM` | Boolean query check | `queryRequest` (Body) |
| `GET` | `/api/imapi/query/defaultQuery` | Get default query template | *(None)* |
| `GET` | `/api/imapi/query/expandCohort` | Expand a cohort within a query | `queryIri`, `cohortIri`, `displayMode` (Query) |
| `POST` | `/api/imapi/query/findRequestMissingArguments` | Find missing arguments in a query request | `queryRequest` (Body) |
| `POST` | `/api/imapi/query/flattenBooleans` | Flatten boolean logic in a query | `query` (Body) |
| `POST` | `/api/imapi/query/getNestedReturns` | Get nested return structures | `match` (Body) |
| `GET` | `/api/imapi/query/imlFromIri` | Generate IML from query IRI | `queryIri` (Query) |
| `GET` | `/api/imapi/query/indicatorDisplay` | Get indicator display data | `queryIri` (Query) |
| `POST` | `/api/imapi/query/optimiseECLQuery` | Optimise ECL query structure | `query` (Body) |
| `POST` | `/api/imapi/query/pathQuery` | Execute path traversal query | `pathQuery` (Body) |
| `GET` | `/api/imapi/query/queryDisplay` | Get query display object | `iri`, `displayMode` (Query) |
| `POST` | `/api/imapi/query/queryDisplayFromQuery` | Generate display from query object | `query`, `displayMode` (Body) |
| `GET` | `/api/imapi/query/queryFromIri` | Fetch query object by IRI | `queryIri` (Query) |
| `POST` | `/api/imapi/query/queryIM` | Execute standard IM query | `query` (Body) |
| `POST` | `/api/imapi/query/queryIMSearch` | Execute IM search query | `query` (Body) |
| `POST` | `/api/imapi/query/queryRequestForSQL` | Convert query request to SQL-ready format | `queryRequest` (Body) |
| `GET` | `/api/imapi/query/sql` | Generate SQL from query IRI | `queryIri`, `lang` (Query) |
| `POST` | `/api/imapi/query/sql` | Generate SQL from query object | `queryRequest` (Body) |
| `GET` | `/api/imapi/query/subQueries` | Get dependent sub-queries | `queryIri` (Query) |
| `GET` | `/api/imapi/query/subsets` | Get query subsets | `iri` (Query) |
| `POST` | `/api/imapi/query/testRunQuery` | Dry-run a query request | `queryRequest` (Body) |
| `POST` | `/api/imapi/query/validateQuery` | Validate a query object | `query` (Body) |

### 📊 Set
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/set/export` | Export concept set (IMv1) | `iri` (Query) |
| `GET` | `/api/imapi/set/members` | Get paginated set members | `iri`, `entailments`, `page`, `size` (Query) |
| `POST` | `/api/imapi/set/membersFromQuery` | Get set members derived from a query | `query`, `page`, `size` (Body) |
| `GET` | `/api/imapi/set/publish` | Publish a concept set | `iri` (Query) |
| `GET` | `/api/imapi/set/setDiff` | Compare two sets | `iriA`, `iriB` (Query) |
| `POST` | `/api/imapi/set/setExport` | Export set with advanced formatting options | `ownRow`, `format`, `options` (Body) |
| `POST` | `/api/imapi/set/updateSubsetsFromSuper` | Update subsets based on super-set changes | `entity` (Body) |

### 🛠️ Status
| Method | Path | Description | Parameters |
|:---|:---|:---|:---|
| `GET` | `/api/imapi/status/isDevMode` | Check if running in development mode | *(None)* |

---

## ⏱️ Job Queue (`/api/queue/`)
Manages asynchronous query execution jobs via RabbitMQ and MySQL persistence.

| Method   | Path | Description | Parameters |
|:---------|:---|:---|:---|
| `GET`    | `/api/queue` | List user's jobs with pagination | `page`, `size`, `date` (Query) |
| `POST`   | `/api/queue/add` | Submit a new job for execution | `JobRequest` (Body) |
| `GET`    | `/api/queue/job/:jobId` | Get job details & status | `jobId` (Path) |
| `DELETE` | `/api/queue/job/:jobId` | Delete a job record | `jobId` (Path) |
| `GET`    | `/api/queue/job/results/:jobId/:queryType/:queryIri` | Get paginated execution results | `jobId`, `queryType`, `queryIri` (Path), `page`, `size` (Query) |
| `GET`    | `/api/queue/job/stop/:jobId` | Cancel/stop a running or queued job | `jobId` (Path) |
