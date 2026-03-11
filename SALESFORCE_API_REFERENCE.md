# Salesforce REST API -- Comprehensive Reference for CLI Build

**Latest API Version:** v62.0 (Winter '25) -- use v63.0 for Spring '25 if available
**Base URL Pattern:** `https://{instance}.salesforce.com/services/data/v62.0`
**Alt Base (My Domain):** `https://{mydomain}.my.salesforce.com/services/data/v62.0`

---

## 1. AUTHENTICATION

### OAuth 2.0 Endpoints (from OpenID Discovery)

| Endpoint | URL |
|----------|-----|
| Authorization | `https://login.salesforce.com/services/oauth2/authorize` |
| Token | `https://login.salesforce.com/services/oauth2/token` |
| Revoke | `https://login.salesforce.com/services/oauth2/revoke` |
| UserInfo | `https://login.salesforce.com/services/oauth2/userinfo` |
| Introspect | `https://login.salesforce.com/services/oauth2/introspect` |
| JWKS | `https://login.salesforce.com/id/keys` |
| Register | `https://login.salesforce.com/services/oauth2/register` |

**Sandbox:** Replace `login.salesforce.com` with `test.salesforce.com`

### OAuth Flows

#### A. Username-Password Flow (simplest for CLI)
```
POST /services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&client_id={consumer_key}
&client_secret={consumer_secret}
&username={username}
&password={password}{security_token}
```
Response: `{ "access_token", "instance_url", "id", "token_type": "Bearer", "issued_at", "signature" }`

#### B. JWT Bearer Token Flow (server-to-server, no user interaction)
```
POST /services/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion={jwt_token}
```
JWT payload: `{ "iss": "{consumer_key}", "sub": "{username}", "aud": "https://login.salesforce.com", "exp": "{epoch}" }`
Sign with private key (RS256). Connected App must have the certificate uploaded.

#### C. Web Server Flow (Authorization Code)
```
Step 1: GET /services/oauth2/authorize?response_type=code&client_id={key}&redirect_uri={uri}
Step 2: POST /services/oauth2/token
  grant_type=authorization_code
  &code={auth_code}
  &client_id={consumer_key}
  &client_secret={consumer_secret}
  &redirect_uri={redirect_uri}
```

#### D. Client Credentials Flow (Spring '23+, no user context)
```
POST /services/oauth2/token
grant_type=client_credentials
&client_id={consumer_key}
&client_secret={consumer_secret}
```

#### E. Refresh Token Flow
```
POST /services/oauth2/token
grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={consumer_key}
&client_secret={consumer_secret}
```

#### F. Device Authorization Flow
```
POST /services/oauth2/token
grant_type=device_code
```

### Auth Headers for All API Calls
```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### Connected App Setup (Required)
1. Setup > App Manager > New Connected App
2. Enable OAuth Settings
3. Set callback URL (for web flow: `http://localhost:1717/OauthRedirect`)
4. Select OAuth Scopes: `api`, `refresh_token`, `offline_access`
5. Note Consumer Key + Consumer Secret

---

## 2. CORE REST API RESOURCES

### 2.1 Versions & Limits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services/data/` | List available API versions |
| GET | `/services/data/v62.0/` | List available resources for version |
| GET | `/services/data/v62.0/limits` | Org limits (API calls remaining, storage, etc.) |

### 2.2 SObject Operations (CRUD)

**Base:** `/services/data/v62.0/sobjects`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/sobjects` | Describe Global -- list all SObjects | `sf sobjects list` |
| GET | `/sobjects/{SObject}` | Basic info + recent items for SObject | `sf sobject info {type}` |
| GET | `/sobjects/{SObject}/describe` | Full describe -- all fields, picklists, relationships | `sf sobject describe {type}` |
| GET | `/sobjects/{SObject}/describe/compactLayouts` | Compact layouts | `sf sobject compact-layouts {type}` |
| GET | `/sobjects/{SObject}/describe/approvalLayouts` | Approval layouts | `sf sobject approval-layouts {type}` |
| POST | `/sobjects/{SObject}` | Create record | `sf record create {type}` |
| GET | `/sobjects/{SObject}/{id}` | Retrieve record by ID | `sf record get {type} {id}` |
| GET | `/sobjects/{SObject}/{id}?fields=F1,F2` | Retrieve specific fields | `sf record get {type} {id} -f F1,F2` |
| PATCH | `/sobjects/{SObject}/{id}` | Update record | `sf record update {type} {id}` |
| DELETE | `/sobjects/{SObject}/{id}` | Delete record | `sf record delete {type} {id}` |
| GET | `/sobjects/{SObject}/updated/?start={s}&end={e}` | Get updated records in date range | `sf record updated {type}` |
| GET | `/sobjects/{SObject}/deleted/?start={s}&end={e}` | Get deleted records in date range | `sf record deleted {type}` |

### 2.3 SObject by External ID (Upsert)

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/sobjects/{SObject}/{ExtIdField}/{ExtIdValue}` | Get by external ID | `sf record get-by-ext-id {type} {field} {value}` |
| PATCH | `/sobjects/{SObject}/{ExtIdField}/{ExtIdValue}` | Upsert by external ID | `sf record upsert {type} {field} {value}` |
| DELETE | `/sobjects/{SObject}/{ExtIdField}/{ExtIdValue}` | Delete by external ID | `sf record delete-by-ext-id {type} {field} {value}` |

### 2.4 SObject Relationships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sobjects/{SObject}/{id}/{RelationshipName}` | Traverse relationship |
| PATCH | `/sobjects/{SObject}/{id}/{RelationshipName}` | Update related record |

### 2.5 SObject Blob/Binary Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sobjects/{SObject}/{id}/{BlobField}` | Retrieve blob field (Attachment Body, Document, ContentVersion) |
| POST | `/sobjects/{SObject}` (multipart) | Create record with binary data |
| PATCH | `/sobjects/{SObject}/{id}` (multipart) | Update record with binary data |

### 2.6 SObject Collections (Composite/Batch CRUD -- up to 200 records)

**Base:** `/services/data/v62.0/composite/sobjects`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/composite/sobjects` | Create up to 200 records | `sf records create` |
| POST | `/composite/sobjects/{SObject}` | Retrieve up to 2000 records by ID | `sf records get {type}` |
| PATCH | `/composite/sobjects` | Update up to 200 records | `sf records update` |
| PATCH | `/composite/sobjects/{SObject}/{ExtIdField}` | Upsert up to 200 by external ID | `sf records upsert` |
| DELETE | `/composite/sobjects?ids=id1,id2,...&allOrNone=bool` | Delete up to 200 records | `sf records delete` |

Request body for create/update:
```json
{
  "allOrNone": false,
  "records": [
    { "attributes": {"type": "Account"}, "Name": "Acme" },
    { "attributes": {"type": "Account"}, "Name": "Globex" }
  ]
}
```

---

## 3. SOQL QUERIES

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/query?q={SOQL}` | Execute SOQL query | `sf query "{SOQL}"` |
| GET | `/queryAll?q={SOQL}` | Query including deleted/archived | `sf query "{SOQL}" --all` |
| GET | `/query/{locator}` | Get next page of results | (auto-pagination) |
| GET | `/query?explain={SOQL}` | Query execution plan (no data) | `sf query explain "{SOQL}"` |

### SOQL Syntax Reference

```sql
-- Basic query
SELECT Id, Name, Email FROM Contact WHERE AccountId = '001...'

-- Relationships (parent)
SELECT Id, Name, Account.Name FROM Contact

-- Relationships (child subquery)
SELECT Id, Name, (SELECT Id, LastName FROM Contacts) FROM Account

-- Aggregate
SELECT COUNT(Id), SUM(Amount), AVG(Amount) FROM Opportunity GROUP BY StageName

-- Date literals
SELECT Id FROM Opportunity WHERE CloseDate = TODAY
SELECT Id FROM Opportunity WHERE CreatedDate = LAST_N_DAYS:30

-- LIKE
SELECT Id, Name FROM Account WHERE Name LIKE '%Acme%'

-- IN
SELECT Id FROM Contact WHERE Id IN (SELECT ContactId FROM CampaignMember WHERE CampaignId = '701...')

-- ORDER BY, LIMIT, OFFSET
SELECT Id, Name FROM Account ORDER BY Name ASC LIMIT 100 OFFSET 50

-- TYPEOF (polymorphic)
SELECT TYPEOF What WHEN Account THEN Name WHEN Opportunity THEN StageName END FROM Task

-- FORMAT() for localized values
SELECT FORMAT(Amount) FROM Opportunity
```

**Date Literals:** `TODAY`, `YESTERDAY`, `TOMORROW`, `LAST_WEEK`, `THIS_WEEK`, `NEXT_WEEK`, `LAST_MONTH`, `THIS_MONTH`, `NEXT_MONTH`, `LAST_QUARTER`, `THIS_QUARTER`, `NEXT_QUARTER`, `LAST_YEAR`, `THIS_YEAR`, `NEXT_YEAR`, `LAST_N_DAYS:n`, `NEXT_N_DAYS:n`, `LAST_N_WEEKS:n`, `LAST_N_MONTHS:n`, `LAST_N_QUARTERS:n`, `LAST_N_YEARS:n`

---

## 4. SOSL SEARCH

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/search?q={SOSL}` | Execute SOSL search | `sf search "{SOSL}"` |
| GET | `/parameterizedSearch?q={term}&sobject={type}` | Parameterized search | `sf search param` |
| GET | `/search/suggestions?q={text}&sobject={type}` | Search suggestions | `sf search suggest` |
| GET | `/search/scopeOrder` | Default search scope order | `sf search scope` |
| GET | `/search/layout?q={types}` | Search result layouts | `sf search layout` |

### SOSL Syntax
```
FIND {search_term} IN ALL FIELDS RETURNING Account(Id, Name), Contact(Id, Name, Email) LIMIT 20
FIND {search_term} IN NAME FIELDS RETURNING Lead(Id, Name WHERE State = 'CA') LIMIT 50
```

---

## 5. COMPOSITE API

### 5.1 Composite Request (up to 25 subrequests, supports references)

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/composite` | Execute composite request | `sf composite execute` |

```json
{
  "allOrNone": true,
  "compositeRequest": [
    {
      "method": "POST",
      "url": "/services/data/v62.0/sobjects/Account",
      "referenceId": "newAccount",
      "body": { "Name": "Acme Corp" }
    },
    {
      "method": "POST",
      "url": "/services/data/v62.0/sobjects/Contact",
      "referenceId": "newContact",
      "body": {
        "LastName": "Doe",
        "AccountId": "@{newAccount.id}"
      }
    }
  ]
}
```

### 5.2 Composite Batch (up to 25 subrequests, NO references between)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/composite/batch` | Execute batch of independent requests |

```json
{
  "batchRequests": [
    { "method": "GET", "url": "v62.0/sobjects/Account/001xxx" },
    { "method": "GET", "url": "v62.0/sobjects/Contact/003xxx" }
  ]
}
```

### 5.3 SObject Tree (create records with parent-child in one call)

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/composite/tree/{SObject}` | Create record tree | `sf tree create {type}` |

```json
{
  "records": [
    {
      "attributes": {"type": "Account", "referenceId": "ref1"},
      "Name": "Acme",
      "Contacts": {
        "records": [
          {
            "attributes": {"type": "Contact", "referenceId": "ref2"},
            "LastName": "Doe"
          }
        ]
      }
    }
  ]
}
```

### 5.4 Composite Graph (up to 500 nodes across multiple graphs)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/composite/graph` | Execute composite graph |

---

## 6. BULK API 2.0

**Base:** `/services/data/v62.0/jobs`

### 6.1 Ingest Jobs (Insert, Update, Upsert, Delete)

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/jobs/ingest` | Create ingest job | `sf bulk create-job` |
| GET | `/jobs/ingest` | List all ingest jobs | `sf bulk list-jobs` |
| GET | `/jobs/ingest/{jobId}` | Get job status | `sf bulk job-status {id}` |
| PATCH | `/jobs/ingest/{jobId}` | Close/abort job | `sf bulk close-job {id}` |
| PUT | `/jobs/ingest/{jobId}/batches` | Upload CSV data | `sf bulk upload {id}` |
| DELETE | `/jobs/ingest/{jobId}` | Delete job | `sf bulk delete-job {id}` |
| GET | `/jobs/ingest/{jobId}/successfulResults` | Get successful results CSV | `sf bulk results {id} --status success` |
| GET | `/jobs/ingest/{jobId}/failedResults` | Get failed results CSV | `sf bulk results {id} --status failed` |
| GET | `/jobs/ingest/{jobId}/unprocessedrecords` | Get unprocessed records CSV | `sf bulk results {id} --status unprocessed` |

**Create Job Body:**
```json
{
  "object": "Account",
  "operation": "insert|update|upsert|delete|hardDelete",
  "contentType": "CSV",
  "externalIdFieldName": "External_Id__c",  // for upsert
  "lineEnding": "LF|CRLF",
  "columnDelimiter": "COMMA|TAB|PIPE|SEMICOLON|BACKQUOTE|CARET"
}
```

**Job States:** `Open` -> `UploadComplete` -> `InProgress` -> `JobComplete|Failed|Aborted`

**Workflow:**
1. POST create job (state=Open)
2. PUT upload CSV data (can upload multiple batches)
3. PATCH close job `{"state": "UploadComplete"}`
4. Poll GET until state is `JobComplete`
5. GET results (successful/failed/unprocessed)

### 6.2 Bulk Query Jobs

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/jobs/query` | Create query job | `sf bulk query` |
| GET | `/jobs/query` | List query jobs | `sf bulk list-query-jobs` |
| GET | `/jobs/query/{jobId}` | Get query job info | `sf bulk query-status {id}` |
| PATCH | `/jobs/query/{jobId}` | Abort query job | `sf bulk abort-query {id}` |
| DELETE | `/jobs/query/{jobId}` | Delete query job | `sf bulk delete-query {id}` |
| GET | `/jobs/query/{jobId}/results` | Get query results CSV | `sf bulk query-results {id}` |
| GET | `/jobs/query/{jobId}/results?locator={loc}&maxRecords={n}` | Paginated results | (auto) |

**Create Query Job Body:**
```json
{
  "operation": "query|queryAll",
  "query": "SELECT Id, Name FROM Account WHERE CreatedDate = TODAY",
  "columnDelimiter": "COMMA",
  "lineEnding": "LF"
}
```

---

## 7. ANALYTICS / REPORTS API

**Base:** `/services/data/v62.0/analytics`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/analytics/reports` | List recent reports | `sf report list` |
| POST | `/analytics/reports` | Clone a report | `sf report clone {id}` |
| GET | `/analytics/reports/{id}` | Execute report synchronously | `sf report run {id}` |
| POST | `/analytics/reports/{id}` | Execute with metadata override | `sf report run {id} --filters` |
| DELETE | `/analytics/reports/{id}` | Delete report | `sf report delete {id}` |
| GET | `/analytics/reports/{id}/describe` | Report metadata | `sf report describe {id}` |
| GET | `/analytics/reports/{id}/instances` | List async instances | `sf report instances {id}` |
| POST | `/analytics/reports/{id}/instances` | Execute async | `sf report run-async {id}` |
| GET | `/analytics/reports/{id}/instances/{instId}` | Get async result | `sf report instance {id} {instId}` |

### Dashboards

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/analytics/dashboards` | List dashboards | `sf dashboard list` |
| POST | `/analytics/dashboards` | Clone dashboard | `sf dashboard clone {id}` |
| GET | `/analytics/dashboards/{id}` | Get dashboard metadata | `sf dashboard get {id}` |
| POST | `/analytics/dashboards/{id}` | Get component details | `sf dashboard components {id}` |
| PUT | `/analytics/dashboards/{id}` | Refresh dashboard | `sf dashboard refresh {id}` |
| DELETE | `/analytics/dashboards/{id}` | Delete dashboard | `sf dashboard delete {id}` |
| GET | `/analytics/dashboards/{id}/status` | Dashboard status | `sf dashboard status {id}` |

---

## 8. CHATTER / CONNECT API

**Base:** `/services/data/v62.0/chatter` or `/services/data/v62.0/connect`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/chatter/feeds/news/me/feed-elements` | My news feed | `sf chatter feed` |
| GET | `/chatter/feeds/record/{id}/feed-elements` | Record feed | `sf chatter record-feed {id}` |
| POST | `/chatter/feed-elements` | Post to feed | `sf chatter post` |
| POST | `/chatter/feed-elements/{id}/capabilities/comments/items` | Comment on post | `sf chatter comment {id}` |
| POST | `/chatter/feed-elements/{id}/capabilities/chatter-likes/items` | Like a post | `sf chatter like {id}` |
| DELETE | `/chatter/likes/{likeId}` | Unlike | `sf chatter unlike {id}` |
| GET | `/chatter/users/me` | Current user info | `sf chatter me` |
| GET | `/chatter/users/{userId}` | User profile | `sf chatter user {id}` |
| GET | `/chatter/groups` | List groups | `sf chatter groups` |
| GET | `/chatter/groups/{groupId}/members` | Group members | `sf chatter group-members {id}` |
| POST | `/connect/batch` | Batch Chatter requests | `sf chatter batch` |
| GET | `/connect/communities` | List communities | `sf community list` |

---

## 9. APPROVAL PROCESSES

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/process/approvals` | List approval processes | `sf approval list` |
| POST | `/process/approvals` | Submit/approve/reject | `sf approval submit` |

**Submit for approval:**
```json
{
  "requests": [{
    "actionType": "Submit",
    "contextId": "{recordId}",
    "comments": "Please approve",
    "nextApproverIds": ["005xxx"]
  }]
}
```

**Approve/Reject:**
```json
{
  "requests": [{
    "actionType": "Approve|Reject",
    "contextId": "{workItemId}",
    "comments": "Approved"
  }]
}
```

---

## 10. PROCESS RULES

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/process/rules` | List all process rules | `sf process-rules list` |
| GET | `/process/rules/{SObject}` | Rules for SObject | `sf process-rules get {type}` |
| POST | `/process/rules` | Trigger process rules | `sf process-rules trigger` |

---

## 11. TOOLING API

**Base:** `/services/data/v62.0/tooling`

All SObject CRUD operations work under `/tooling/sobjects/` for developer objects.

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/tooling/sobjects` | List Tooling objects | `sf tooling list` |
| GET | `/tooling/sobjects/{ToolingType}` | Describe Tooling object | `sf tooling describe {type}` |
| GET | `/tooling/sobjects/{ToolingType}/describe` | Full describe | `sf tooling describe {type} --full` |
| POST | `/tooling/sobjects/{ToolingType}` | Create Tooling record | `sf tooling create {type}` |
| GET | `/tooling/sobjects/{ToolingType}/{id}` | Get Tooling record | `sf tooling get {type} {id}` |
| PATCH | `/tooling/sobjects/{ToolingType}/{id}` | Update Tooling record | `sf tooling update {type} {id}` |
| DELETE | `/tooling/sobjects/{ToolingType}/{id}` | Delete Tooling record | `sf tooling delete {type} {id}` |
| GET | `/tooling/query?q={SOQL}` | Tooling SOQL query | `sf tooling query "{SOQL}"` |
| GET | `/tooling/search?q={SOSL}` | Tooling SOSL search | `sf tooling search "{SOSL}"` |
| GET | `/tooling/executeAnonymous?anonymousBody={code}` | Execute anonymous Apex | `sf apex execute` |
| POST | `/tooling/runTestsAsynchronous/` | Run tests async | `sf apex test run` |
| POST | `/tooling/runTestsSynchronous/` | Run tests sync | `sf apex test run --sync` |
| GET | `/tooling/completions?type={apex|visualforce}` | Code completions | `sf tooling completions` |

### Key Tooling SObjects
- `ApexClass`, `ApexTrigger`, `ApexComponent`, `ApexPage`
- `ApexTestResult`, `ApexTestQueueItem`, `ApexCodeCoverage`, `ApexCodeCoverageAggregate`
- `CustomField`, `CustomObject`, `ValidationRule`, `WorkflowRule`
- `FlexiPage`, `Flow`, `FlowDefinition`
- `LightningComponentBundle`, `AuraDefinitionBundle`
- `MetadataContainer`, `ContainerAsyncRequest`
- `TraceFlag`, `DebugLevel`
- `SymbolTable`, `ApexClassMember`, `ApexTriggerMember`

---

## 12. METADATA API (REST)

**Base:** `/services/data/v62.0/metadata`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| POST | `/metadata/deployRequest` | Deploy metadata (zip) | `sf metadata deploy` |
| GET | `/metadata/deployRequest/{asyncId}` | Check deploy status | `sf metadata deploy-status {id}` |
| GET | `/metadata/deployRequest/{asyncId}?includeDetails=true` | Deploy status with details | `sf metadata deploy-status {id} --details` |
| POST | `/metadata/deployRequest` | Deploy recent validation | `sf metadata deploy-recent` |

**SOAP Metadata API** (more comprehensive, via `/services/Soap/m/{version}`):
- `describeMetadata` -- list metadata types
- `listMetadata` -- list components of a type
- `readMetadata` -- read specific components
- `createMetadata` / `updateMetadata` / `upsertMetadata` / `deleteMetadata`
- `renameMetadata`
- `retrieve` / `checkRetrieveStatus` -- retrieve as zip
- `deploy` / `checkDeployStatus` -- deploy from zip
- `cancelDeploy`

---

## 13. APEX REST (Custom Endpoints)

**Base:** `/services/apexrest/{namespace}/{endpoint}`

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/services/apexrest/{path}` | Call custom Apex REST GET | `sf apex rest get {path}` |
| POST | `/services/apexrest/{path}` | Call custom Apex REST POST | `sf apex rest post {path}` |
| PUT | `/services/apexrest/{path}` | Call custom Apex REST PUT | `sf apex rest put {path}` |
| PATCH | `/services/apexrest/{path}` | Call custom Apex REST PATCH | `sf apex rest patch {path}` |
| DELETE | `/services/apexrest/{path}` | Call custom Apex REST DELETE | `sf apex rest delete {path}` |

---

## 14. QUICK ACTIONS

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/quickActions` | List global quick actions | `sf quickaction list` |
| GET | `/quickActions/{actionName}` | Get quick action details | `sf quickaction get {name}` |
| GET | `/quickActions/{actionName}/describe` | Describe quick action | `sf quickaction describe {name}` |
| GET | `/quickActions/{actionName}/defaultValues` | Default values | `sf quickaction defaults {name}` |
| POST | `/quickActions/{actionName}` | Execute quick action | `sf quickaction execute {name}` |
| GET | `/sobjects/{SObject}/quickActions` | SObject quick actions | `sf quickaction list --sobject {type}` |
| GET | `/sobjects/{SObject}/quickActions/{actionName}` | SObject action details | `sf quickaction get {name} --sobject {type}` |
| POST | `/sobjects/{SObject}/quickActions/{actionName}` | Execute SObject action | `sf quickaction execute {name} --sobject {type}` |

---

## 15. LIST VIEWS

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/sobjects/{SObject}/listviews` | List all list views | `sf listview list {type}` |
| GET | `/sobjects/{SObject}/listviews/{id}` | Get list view info | `sf listview get {type} {id}` |
| GET | `/sobjects/{SObject}/listviews/{id}/describe` | Describe list view | `sf listview describe {type} {id}` |
| GET | `/sobjects/{SObject}/listviews/{id}/results` | Execute list view | `sf listview results {type} {id}` |
| GET | `/sobjects/{SObject}/listviews/recent` | Recently used list views | `sf listview recent {type}` |

---

## 16. INVOCABLE ACTIONS

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/actions` | List all action types | `sf action list` |
| GET | `/actions/standard` | List standard actions | `sf action list --standard` |
| GET | `/actions/standard/{actionName}` | Get standard action | `sf action get {name}` |
| POST | `/actions/standard/{actionName}` | Invoke standard action | `sf action invoke {name}` |
| GET | `/actions/custom` | List custom actions | `sf action list --custom` |
| GET | `/actions/custom/apex` | List Apex actions | `sf action list --apex` |
| GET | `/actions/custom/apex/{className}` | Get Apex action | `sf action get-apex {class}` |
| POST | `/actions/custom/apex/{className}` | Invoke Apex action | `sf action invoke-apex {class}` |
| GET | `/actions/custom/flow` | List Flow actions | `sf action list --flow` |
| POST | `/actions/custom/flow/{flowName}` | Invoke Flow | `sf action invoke-flow {flow}` |

---

## 17. TABS, THEMES, RECENT, MISC

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/tabs` | List all tabs | `sf tabs list` |
| GET | `/theme` | Theme/branding info | `sf theme get` |
| GET | `/recent` | Recently viewed records | `sf recent` |
| GET | `/sobjects/{SObject}/layouts` | Page layouts | `sf layout list {type}` |
| GET | `/sobjects/{SObject}/describe/layouts` | Describe layouts | `sf layout describe {type}` |
| GET | `/knowledgeManagement/settings` | Knowledge settings | `sf knowledge settings` |

---

## 18. CONSENT API

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/consent/action/{action}?ids={ids}` | Check consent status | `sf consent check {action}` |
| GET | `/consent/multiaction?actions={a1,a2}&ids={ids}` | Multi-action consent | `sf consent multi-check` |

---

## 19. EVENT MONITORING

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/query?q=SELECT+Id,EventType,LogDate+FROM+EventLogFile` | List event log files | `sf event-log list` |
| GET | `/sobjects/EventLogFile/{id}/LogFile` | Download log file (CSV) | `sf event-log download {id}` |

---

## 20. STANDARD OBJECTS REFERENCE

### Most Commonly Used (for CLI default support)

| Object | API Name | Key Fields |
|--------|----------|------------|
| Account | `Account` | Name, Type, Industry, Website, Phone, BillingCity, OwnerId |
| Contact | `Contact` | FirstName, LastName, Email, Phone, AccountId, Title, MailingCity |
| Lead | `Lead` | FirstName, LastName, Company, Email, Phone, Status, LeadSource |
| Opportunity | `Opportunity` | Name, StageName, CloseDate, Amount, AccountId, Probability |
| Case | `Case` | Subject, Description, Status, Priority, ContactId, AccountId |
| Task | `Task` | Subject, Status, Priority, WhoId, WhatId, ActivityDate |
| Event | `Event` | Subject, StartDateTime, EndDateTime, WhoId, WhatId |
| Campaign | `Campaign` | Name, Type, Status, StartDate, EndDate, BudgetedCost |
| CampaignMember | `CampaignMember` | CampaignId, ContactId/LeadId, Status |
| User | `User` | Username, Email, FirstName, LastName, ProfileId, IsActive |
| Note | `Note` | Title, Body, ParentId |
| Attachment | `Attachment` | Name, Body, ParentId, ContentType |
| ContentDocument | `ContentDocument` | Title, FileType, ContentSize |
| ContentVersion | `ContentVersion` | Title, VersionData, PathOnClient, ContentDocumentId |
| Product2 | `Product2` | Name, ProductCode, Description, IsActive, Family |
| PricebookEntry | `PricebookEntry` | Product2Id, Pricebook2Id, UnitPrice, IsActive |
| OpportunityLineItem | `OpportunityLineItem` | OpportunityId, PricebookEntryId, Quantity, UnitPrice |
| Contract | `Contract` | AccountId, Status, StartDate, ContractTerm |
| Order | `Order` | AccountId, ContractId, Status, EffectiveDate |
| Quote | `Quote` | Name, OpportunityId, Status, ExpirationDate, GrandTotal |
| Solution | `Solution` | SolutionName, SolutionNote, Status, IsPublished |
| Group | `Group` | Name, Type, DoesSendEmailToMembers |
| GroupMember | `GroupMember` | GroupId, UserOrGroupId |
| Profile | `Profile` | Name, UserType |
| PermissionSet | `PermissionSet` | Name, Label, Description |
| RecordType | `RecordType` | Name, SobjectType, DeveloperName, IsActive |
| EmailTemplate | `EmailTemplate` | Name, Subject, Body, FolderId |
| Dashboard | `Dashboard` | Title, FolderId, RunningUserId |
| Report | `Report` | Name, FolderName, Format |
| ListView | `ListView` | Name, SobjectType, DeveloperName |
| EmailMessage | `EmailMessage` | Subject, TextBody, HtmlBody, FromAddress, ParentId |
| FeedItem | `FeedItem` | Body, ParentId, Type |
| CaseComment | `CaseComment` | ParentId, CommentBody, IsPublished |
| AccountContactRelation | `AccountContactRelation` | AccountId, ContactId, Roles |
| OpportunityContactRole | `OpportunityContactRole` | OpportunityId, ContactId, Role |
| UserRole | `UserRole` | Name, ParentRoleId, DeveloperName |

---

## 21. RATE LIMITS & BEST PRACTICES

### API Call Limits (per 24-hour period)

| Edition | Base Limit | Per-User License Add |
|---------|-----------|---------------------|
| Developer | 15,000 | -- |
| Enterprise | 1,000 per license | Up to 100,000 max |
| Unlimited | 5,000 per license | Up to 1,000,000 max |
| Performance | 5,000 per license | Up to 1,000,000 max |

### Concurrent Limits
- **Long-running requests:** 25 concurrent (calls > 20 seconds)
- **Total concurrent API requests:** Varies by edition
- **Bulk API concurrent jobs:** 100 (queued + active batches)

### Response Headers for Rate Tracking
```
Sforce-Limit-Info: api-usage=25/15000
```

### Best Practices
1. **Use Composite/Batch** to reduce API calls (25 subrequests = 1 API call)
2. **Use Bulk API 2.0** for > 2,000 records (10,000 record batches)
3. **Cache describe results** -- SObject metadata rarely changes
4. **Use `If-Modified-Since` header** on describe calls to reduce payload
5. **Query only fields you need** -- never `SELECT *` (not supported anyway)
6. **Use SOQL `LIMIT`** to control result size
7. **Handle pagination** via `nextRecordsUrl` in query responses
8. **Use gzip compression** -- `Accept-Encoding: gzip` header
9. **Use `allOrNone: false`** for partial success in batch operations
10. **Exponential backoff** on 503 errors
11. **Check `/limits`** endpoint proactively to monitor usage
12. **Prefer Bulk API 2.0 over v1** -- simpler, automatic batching

### Error Handling
```json
[{"message": "...", "errorCode": "INVALID_FIELD", "fields": ["BadField__c"]}]
```

Common error codes:
- `MALFORMED_QUERY` -- SOQL syntax error
- `INVALID_FIELD` -- field doesn't exist
- `ENTITY_IS_DELETED` -- record was deleted
- `INSUFFICIENT_ACCESS_OR_READONLY` -- permission denied
- `REQUEST_LIMIT_EXCEEDED` -- API limit hit
- `INVALID_SESSION_ID` -- token expired, re-auth
- `NOT_FOUND` -- record/resource not found (404)
- `DUPLICATE_VALUE` -- unique constraint violated
- `REQUIRED_FIELD_MISSING` -- required field not provided
- `STRING_TOO_LONG` -- field value exceeds max length
- `FIELD_INTEGRITY_EXCEPTION` -- referential integrity error

### HTTP Status Codes
- `200` -- Success
- `201` -- Created
- `204` -- No Content (successful delete/update)
- `400` -- Bad Request (malformed query, missing fields)
- `401` -- Unauthorized (invalid/expired token)
- `403` -- Forbidden (insufficient permissions)
- `404` -- Not Found
- `405` -- Method Not Allowed
- `415` -- Unsupported Media Type
- `500` -- Server Error
- `503` -- Service Unavailable (rate limited or maintenance)

---

## 22. ADDITIONAL API SURFACES

### UI API (Lightning-oriented)
```
/services/data/v62.0/ui-api/object-info/{SObject}
/services/data/v62.0/ui-api/record-ui/{recordId}
/services/data/v62.0/ui-api/records/{recordId}
/services/data/v62.0/ui-api/layout/{SObject}
/services/data/v62.0/ui-api/list-records/{listViewId}
/services/data/v62.0/ui-api/lookups/{SObject}/{fieldName}
```

### Streaming API (CometD/Bayeux)
```
/cometd/62.0 (handshake + subscribe)
Channels:
  /topic/{PushTopicName}
  /event/{PlatformEventName}__e
  /data/ChangeEvents (Change Data Capture)
  /data/{SObject}ChangeEvent
```

### Einstein Analytics / Tableau CRM
```
/services/data/v62.0/wave/...
  /wave/datasets
  /wave/lenses
  /wave/dashboards
  /wave/query (SAQL)
```

### Connect API (Communities, Managed Content)
```
/services/data/v62.0/connect/...
  /connect/communities
  /connect/communities/{id}/managed-content/delivery
  /connect/organization
```

---

## 23. FULL CLI COMMAND MAP (150+ commands)

### Auth (8 commands)
1. `sf auth login` -- Username-password flow
2. `sf auth login-jwt` -- JWT bearer flow
3. `sf auth login-web` -- Web server OAuth flow
4. `sf auth login-client-credentials` -- Client credentials flow
5. `sf auth refresh` -- Refresh token
6. `sf auth revoke` -- Revoke token
7. `sf auth status` -- Check auth / show userinfo
8. `sf auth list` -- List saved orgs

### SObject Metadata (6 commands)
9. `sf sobject list` -- Describe global (list all objects)
10. `sf sobject describe {type}` -- Full describe with fields
11. `sf sobject info {type}` -- Basic info + recent items
12. `sf sobject compact-layouts {type}` -- Compact layouts
13. `sf sobject approval-layouts {type}` -- Approval layouts
14. `sf sobject layouts {type}` -- Page layouts

### Record CRUD (10 commands)
15. `sf record create {type}` -- Create single record
16. `sf record get {type} {id}` -- Retrieve by ID
17. `sf record update {type} {id}` -- Update by ID
18. `sf record delete {type} {id}` -- Delete by ID
19. `sf record upsert {type} {field} {value}` -- Upsert by external ID
20. `sf record get-by-ext-id {type} {field} {value}` -- Get by external ID
21. `sf record delete-by-ext-id {type} {field} {value}` -- Delete by external ID
22. `sf record updated {type}` -- Recently updated records
23. `sf record deleted {type}` -- Recently deleted records
24. `sf record relationship {type} {id} {relName}` -- Traverse relationship

### Records Collection (5 commands)
25. `sf records create` -- Create up to 200 records
26. `sf records get {type}` -- Retrieve up to 2000 by IDs
27. `sf records update` -- Update up to 200 records
28. `sf records upsert {type} {field}` -- Upsert up to 200
29. `sf records delete` -- Delete up to 200

### Query (4 commands)
30. `sf query` -- Execute SOQL query
31. `sf query --all` -- Query including deleted/archived
32. `sf query --explain` -- Query plan only
33. `sf query --tooling` -- Tooling API query

### Search (5 commands)
34. `sf search` -- Execute SOSL search
35. `sf search param` -- Parameterized search
36. `sf search suggest` -- Search suggestions
37. `sf search scope` -- Search scope order
38. `sf search layout` -- Search result layouts

### Composite (4 commands)
39. `sf composite execute` -- Execute composite request
40. `sf composite batch` -- Execute batch request
41. `sf composite tree {type}` -- Create record tree
42. `sf composite graph` -- Execute composite graph

### Bulk API 2.0 -- Ingest (9 commands)
43. `sf bulk create-job` -- Create ingest job
44. `sf bulk list-jobs` -- List ingest jobs
45. `sf bulk job-status {id}` -- Get job status
46. `sf bulk upload {id}` -- Upload CSV data
47. `sf bulk close-job {id}` -- Close job (start processing)
48. `sf bulk abort-job {id}` -- Abort job
49. `sf bulk delete-job {id}` -- Delete job
50. `sf bulk results {id}` -- Get results (success/fail/unprocessed)
51. `sf bulk import {type} {file}` -- Full import workflow (create+upload+close+poll+results)

### Bulk API 2.0 -- Query (6 commands)
52. `sf bulk query {soql}` -- Create and run bulk query
53. `sf bulk list-query-jobs` -- List query jobs
54. `sf bulk query-status {id}` -- Get query job info
55. `sf bulk query-results {id}` -- Download query results CSV
56. `sf bulk abort-query {id}` -- Abort query job
57. `sf bulk delete-query {id}` -- Delete query job

### Reports (9 commands)
58. `sf report list` -- List recent reports
59. `sf report run {id}` -- Execute report sync
60. `sf report run-async {id}` -- Execute report async
61. `sf report describe {id}` -- Report metadata
62. `sf report clone {id}` -- Clone report
63. `sf report delete {id}` -- Delete report
64. `sf report instances {id}` -- List async instances
65. `sf report instance {id} {instId}` -- Get async result
66. `sf report explain {id}` -- Query plan for report

### Dashboards (7 commands)
67. `sf dashboard list` -- List dashboards
68. `sf dashboard get {id}` -- Get dashboard
69. `sf dashboard refresh {id}` -- Refresh dashboard
70. `sf dashboard components {id}` -- Component details
71. `sf dashboard clone {id}` -- Clone dashboard
72. `sf dashboard delete {id}` -- Delete dashboard
73. `sf dashboard status {id}` -- Dashboard status

### Chatter (12 commands)
74. `sf chatter feed` -- My news feed
75. `sf chatter record-feed {id}` -- Record feed
76. `sf chatter post` -- Post to feed
77. `sf chatter comment {id}` -- Comment on post
78. `sf chatter like {id}` -- Like a post
79. `sf chatter unlike {id}` -- Unlike
80. `sf chatter me` -- Current user
81. `sf chatter user {id}` -- User profile
82. `sf chatter groups` -- List groups
83. `sf chatter group-members {id}` -- Group members
84. `sf chatter batch` -- Batch requests
85. `sf chatter search {term}` -- Search Chatter

### Approvals (4 commands)
86. `sf approval list` -- List approval processes
87. `sf approval submit {recordId}` -- Submit for approval
88. `sf approval approve {workItemId}` -- Approve
89. `sf approval reject {workItemId}` -- Reject

### Process Rules (3 commands)
90. `sf process-rule list` -- List process rules
91. `sf process-rule get {type}` -- Get rules for object
92. `sf process-rule trigger` -- Trigger process rules

### Tooling (12 commands)
93. `sf tooling list` -- List Tooling objects
94. `sf tooling describe {type}` -- Describe Tooling object
95. `sf tooling create {type}` -- Create Tooling record
96. `sf tooling get {type} {id}` -- Get Tooling record
97. `sf tooling update {type} {id}` -- Update Tooling record
98. `sf tooling delete {type} {id}` -- Delete Tooling record
99. `sf tooling query` -- Tooling SOQL query
100. `sf tooling search` -- Tooling SOSL search
101. `sf tooling completions` -- Code completions

### Apex (5 commands)
102. `sf apex execute` -- Execute anonymous Apex
103. `sf apex test run` -- Run tests async
104. `sf apex test run --sync` -- Run tests sync
105. `sf apex rest get {path}` -- Apex REST GET
106. `sf apex rest post {path}` -- Apex REST POST
107. `sf apex rest put {path}` -- Apex REST PUT
108. `sf apex rest patch {path}` -- Apex REST PATCH
109. `sf apex rest delete {path}` -- Apex REST DELETE

### Metadata (4 commands)
110. `sf metadata deploy` -- Deploy metadata
111. `sf metadata deploy-status {id}` -- Check deploy status
112. `sf metadata deploy-recent` -- Deploy recent validation
113. `sf metadata retrieve` -- Retrieve metadata

### Quick Actions (6 commands)
114. `sf quickaction list` -- List global quick actions
115. `sf quickaction get {name}` -- Get action details
116. `sf quickaction describe {name}` -- Describe action
117. `sf quickaction defaults {name}` -- Default values
118. `sf quickaction execute {name}` -- Execute action
119. `sf quickaction list --sobject {type}` -- SObject actions

### List Views (5 commands)
120. `sf listview list {type}` -- List views for object
121. `sf listview get {type} {id}` -- Get list view
122. `sf listview describe {type} {id}` -- Describe list view
123. `sf listview results {type} {id}` -- Execute list view
124. `sf listview recent {type}` -- Recent list views

### Invocable Actions (6 commands)
125. `sf action list` -- List action types
126. `sf action list --standard` -- Standard actions
127. `sf action list --custom` -- Custom actions
128. `sf action get {name}` -- Get action details
129. `sf action invoke {name}` -- Invoke action
130. `sf action invoke-flow {flow}` -- Invoke flow

### Org Info (6 commands)
131. `sf org limits` -- Organization limits
132. `sf org tabs` -- List tabs
133. `sf org theme` -- Theme info
134. `sf org recent` -- Recently viewed records
135. `sf org versions` -- Available API versions
136. `sf org resources` -- Available resources

### Users & Permissions (6 commands)
137. `sf user list` -- List users (SOQL)
138. `sf user get {id}` -- Get user
139. `sf user create` -- Create user
140. `sf user update {id}` -- Update user
141. `sf user deactivate {id}` -- Deactivate user
142. `sf user password-reset {id}` -- Reset password

### Consent (2 commands)
143. `sf consent check {action}` -- Check consent
144. `sf consent multi-check` -- Multi-action consent

### Event Logs (2 commands)
145. `sf event-log list` -- List event log files
146. `sf event-log download {id}` -- Download log file

### Files (6 commands)
147. `sf file upload {sobject} {id}` -- Upload file/attachment
148. `sf file download {sobject} {id} {field}` -- Download blob
149. `sf file list` -- List ContentDocuments
150. `sf file get {id}` -- Get ContentVersion
151. `sf file versions {id}` -- List versions
152. `sf file share {id}` -- Share ContentDocument

### Utility (4 commands)
153. `sf config set` -- Set instance URL, API version
154. `sf config get` -- Show configuration
155. `sf config list` -- List all configs
156. `sf request {method} {path}` -- Raw API request (escape hatch)
