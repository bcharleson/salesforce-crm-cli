# Salesforce CLI — Agent Guide

A CLI and MCP server for the Salesforce REST API. Manage accounts, contacts, leads, opportunities, cases, tasks, events, campaigns, users, run SOQL/SOSL queries, bulk operations, composite requests, reports, Apex execution, and more.

## Quick Start

```bash
# Install globally
npm install -g salesforce-cli

# Authenticate (access token method)
salesforce login --access-token <TOKEN> --instance-url https://yourinstance.salesforce.com

# Authenticate (OAuth username-password flow)
salesforce login --client-id <CONNECTED_APP_KEY> --username <USER> --password <PASS+SECURITY_TOKEN>

# Verify
salesforce status
salesforce limits get
```

## Authentication

Three ways to authenticate (highest priority first):

1. **CLI flags:** `--access-token <token> --instance-url <url>`
2. **Environment variables:** `SALESFORCE_ACCESS_TOKEN` + `SALESFORCE_INSTANCE_URL`
3. **Stored config:** `~/.salesforce-cli/config.json` (created by `salesforce login`)

Also supports: `SF_ACCESS_TOKEN`, `SF_INSTANCE_URL` (shorter env var names).

## Output Format

- **Default:** Compact JSON (one line) — optimized for agent consumption
- `--pretty` or `--output pretty`: Formatted JSON
- `--quiet`: Suppress output, exit codes only
- `--fields <fields>`: Pick specific fields (supports nested: `properties.Name`)

## Global Options

| Flag | Description |
|------|-------------|
| `--access-token <token>` | Override stored token |
| `--instance-url <url>` | Override stored instance URL |
| `--api-version <ver>` | API version (default: v62.0) |
| `--pretty` | Pretty-print JSON |
| `--quiet` | Suppress output |
| `--fields <fields>` | Select specific fields |

## Command Groups (100+ commands)

### Core CRM Objects (factory-generated — 7 commands each)

Each object supports: `list`, `get`, `create`, `update`, `delete`, `search`, `describe`

| Group | SObject | Key Fields |
|-------|---------|------------|
| `accounts` | Account | Name, Type, Industry, Phone, Website, AnnualRevenue |
| `contacts` | Contact | FirstName, LastName, Email, Phone, Title, AccountId |
| `leads` | Lead | FirstName, LastName, Company, Email, Status, LeadSource |
| `opportunities` | Opportunity | Name, StageName, Amount, CloseDate, AccountId |
| `cases` | Case | Subject, Status, Priority, Origin, ContactId, AccountId |
| `tasks` | Task | Subject, Status, Priority, ActivityDate, WhoId, WhatId |
| `events` | Event | Subject, StartDateTime, EndDateTime, Location, WhoId |
| `campaigns` | Campaign | Name, Type, Status, StartDate, EndDate, BudgetedCost |
| `users` | User | Username, Name, Email, IsActive, ProfileId |

### Query & Search

| Command | Description |
|---------|-------------|
| `query run --soql <SOQL>` | Execute a SOQL query |
| `query explain --soql <SOQL>` | Get query execution plan |
| `query more --url <nextRecordsUrl>` | Fetch next page of results |
| `search run --sosl <SOSL>` | Execute a SOSL search across objects |
| `search suggest --text <text> --sobject <type>` | Get search suggestions |

### Generic SObject Operations

| Command | Description |
|---------|-------------|
| `sobjects list` | List all SObject types in the org |
| `sobjects describe <type>` | Full metadata (fields, relationships, picklists) |
| `sobjects metadata <type>` | Basic metadata (lighter than describe) |
| `sobjects get <type> <id>` | Get any record by type and ID |
| `sobjects create <type> --data <json>` | Create a record with JSON data |
| `sobjects update <type> <id> --data <json>` | Update a record with JSON data |
| `sobjects delete <type> <id>` | Delete any record |
| `sobjects upsert <type> --external-field <field> --external-value <val> --data <json>` | Upsert by external ID |

### Bulk API 2.0

| Command | Description |
|---------|-------------|
| `bulk ingest-create --sobject <type> --operation <op>` | Create a bulk ingest job |
| `bulk ingest-upload --job-id <id> --csv <data>` | Upload CSV data to a job |
| `bulk ingest-close --job-id <id>` | Close job to begin processing |
| `bulk ingest-status --job-id <id>` | Check job status |
| `bulk ingest-results --job-id <id> --type <type>` | Get results (successful/failed/unprocessed) |
| `bulk ingest-abort --job-id <id>` | Abort a job |
| `bulk ingest-list` | List all ingest jobs |
| `bulk query-create --soql <query>` | Create a bulk query job |
| `bulk query-status --job-id <id>` | Check bulk query status |
| `bulk query-results --job-id <id>` | Get bulk query results |

### Composite API

| Command | Description |
|---------|-------------|
| `composite run --requests <json>` | Execute composite request (25 subrequests, supports references) |
| `composite batch --requests <json>` | Execute batch of independent subrequests |
| `composite tree --sobject <type> --records <json>` | Create record tree (parent + children) |
| `composite collection --method <op> --records <json>` | CRUD up to 200 records in one call |

### Reports & Dashboards

| Command | Description |
|---------|-------------|
| `reports list` | List all reports |
| `reports get <id>` | Get report metadata |
| `reports run <id>` | Execute report and return results |
| `reports dashboards-list` | List all dashboards |
| `reports dashboards-get <id>` | Get dashboard details |

### Apex

| Command | Description |
|---------|-------------|
| `apex execute --code <apex>` | Execute anonymous Apex |
| `apex rest --path <path> --method <method>` | Call custom Apex REST endpoint |
| `apex test-run --class-ids <ids>` | Run Apex test classes |
| `apex test-results --run-id <id>` | Get test run results |

### Limits & Info

| Command | Description |
|---------|-------------|
| `limits get` | Get org API limits and usage |
| `limits versions` | List all API versions |
| `limits resources` | List available REST resources |

## Common Workflows

### Look up an Account and its Contacts
```bash
# Find the account
salesforce accounts search --where "Name LIKE '%Acme%'"

# Get contacts for that account
salesforce contacts list --where "AccountId = '001xx000003GYQIAA4'"
```

### Create an Opportunity with a Task
```bash
# Create the opportunity
salesforce opportunities create --name "Acme Deal" --stage "Prospecting" --close-date "2026-06-30" --amount "50000" --account-id "001xx000003GYQIAA4"

# Create a follow-up task
salesforce tasks create --subject "Follow up on Acme Deal" --due-date "2026-04-01" --what-id "<opportunity_id>" --priority "High"
```

### Bulk Insert Accounts
```bash
# Create the job
salesforce bulk ingest-create --sobject Account --operation insert

# Upload CSV data
salesforce bulk ingest-upload --job-id <JOB_ID> --csv "Name,Industry\nAcme Corp,Technology\nGlobex Inc,Finance"

# Close to begin processing
salesforce bulk ingest-close --job-id <JOB_ID>

# Check status
salesforce bulk ingest-status --job-id <JOB_ID>

# Get results
salesforce bulk ingest-results --job-id <JOB_ID>
```

### Run a Complex SOQL Query
```bash
salesforce query run --soql "SELECT Account.Name, COUNT(Id) FROM Contact GROUP BY Account.Name HAVING COUNT(Id) > 5 ORDER BY COUNT(Id) DESC"
```

### Composite: Create Account + Contact in One Call
```bash
salesforce composite run --requests '[
  {"method":"POST","url":"/services/data/v62.0/sobjects/Account","referenceId":"newAccount","body":{"Name":"Acme Corp"}},
  {"method":"POST","url":"/services/data/v62.0/sobjects/Contact","referenceId":"newContact","body":{"LastName":"Smith","AccountId":"@{newAccount.id}"}}
]'
```

### Describe Any Object (including Custom Objects)
```bash
salesforce sobjects describe CustomObject__c
salesforce sobjects describe Account --fields "fields" | jq '.fields[] | {name, type, label}'
```

## SOQL Reference (Quick)

```sql
-- Basic query
SELECT Id, Name FROM Account WHERE Industry = 'Technology' LIMIT 10

-- Date literals
SELECT Id FROM Lead WHERE CreatedDate = TODAY
SELECT Id FROM Opportunity WHERE CloseDate = THIS_QUARTER

-- Relationships
SELECT Account.Name, LastName FROM Contact WHERE Account.Industry = 'Finance'

-- Aggregate
SELECT StageName, SUM(Amount) FROM Opportunity GROUP BY StageName

-- Subquery
SELECT Name, (SELECT LastName FROM Contacts) FROM Account
```

## MCP Server Configuration

### For Claude Desktop / Cursor / VS Code
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["salesforce-cli", "mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token-here",
        "SALESFORCE_INSTANCE_URL": "https://yourinstance.salesforce.com"
      }
    }
  }
}
```

### Direct MCP Entry
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["/path/to/salesforce-cli/dist/mcp.js"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token-here",
        "SALESFORCE_INSTANCE_URL": "https://yourinstance.salesforce.com"
      }
    }
  }
}
```

## Tips for AI Agents

1. **SOQL is your power tool.** Use `query run` for complex queries spanning multiple objects with JOINs, aggregations, and subqueries.
2. **Use `sobjects describe` first** when working with unfamiliar objects or custom objects — it returns all fields, types, picklist values, and relationships.
3. **Prefer `--where` over iterating.** Filter server-side in SOQL rather than fetching all records and filtering client-side.
4. **Composite API for multi-step operations.** Use `composite run` to create related records in a single API call with references between them.
5. **Bulk API for large data.** Use `bulk ingest-create` for operations involving 200+ records — it's asynchronous and handles rate limits.
6. **Check limits before bulk ops.** Run `limits get` to check remaining daily API calls and data storage.
7. **Custom objects use `__c` suffix.** Always use the API name (e.g., `Custom_Object__c`, `Custom_Field__c`).
8. **Use `--fields` for targeted output.** Don't dump entire records — select only the fields you need.
9. **SOSL for cross-object text search.** When searching for a term across multiple objects, use `search run` with SOSL.
10. **Date literals save parsing.** Use `TODAY`, `THIS_WEEK`, `THIS_QUARTER`, `LAST_N_DAYS:30` in SOQL WHERE clauses.
11. **Record IDs are 15 or 18 characters.** Both formats work, but 18-char is case-insensitive and preferred.
12. **Upsert for idempotency.** Use `sobjects upsert` with external IDs to safely create-or-update without checking existence first.
