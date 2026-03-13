# Salesforce CRM CLI — Agent Guide

You have access to the Salesforce REST API through `salesforce-crm-cli`. This gives you full CRM access: read and write accounts, contacts, leads, opportunities, cases, tasks, events, campaigns, users, run SOQL/SOSL queries, execute bulk operations, composite requests, anonymous Apex, and more.

**102 commands. All output is JSON.**

---

## Setup

### Install

```bash
npm install -g salesforce-crm-cli
```

### Authenticate

```bash
# Access token (fastest)
salesforce login --access-token <TOKEN> --instance-url https://yourorg.salesforce.com

# OAuth username/password
salesforce login --client-id <KEY> --username <USER> --password <PASS+SECURITY_TOKEN>

# Or set env vars (works without running login)
export SALESFORCE_ACCESS_TOKEN="..."
export SALESFORCE_INSTANCE_URL="https://yourorg.salesforce.com"
```

### Verify

```bash
salesforce status
salesforce limits get
```

---

## MCP Configuration

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["salesforce-crm-cli", "mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token",
        "SALESFORCE_INSTANCE_URL": "https://yourorg.salesforce.com"
      }
    }
  }
}
```

### Cursor / VS Code (`.cursor/mcp.json` or `.vscode/mcp.json`)

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "salesforce",
      "args": ["mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token",
        "SALESFORCE_INSTANCE_URL": "https://yourorg.salesforce.com"
      }
    }
  }
}
```

---

## Output Control

| Flag | When to use |
|------|-------------|
| *(none)* | Default compact JSON — best for agent parsing |
| `--pretty` | Human-readable formatted JSON |
| `--quiet` | Suppress output, use exit codes only |
| `--fields <f1,f2>` | Select specific fields to reduce noise |

---

## Command Reference

### Authentication

```bash
salesforce login --access-token <token> --instance-url <url>
salesforce logout
salesforce status
```

### Core CRM Objects (9 objects × 7 commands each)

Each object supports: `list`, `get`, `create`, `update`, `delete`, `search`, `describe`

#### Accounts
```bash
salesforce accounts list [--where <soql_where>] [--limit <n>] [--fields <fields>]
salesforce accounts get <id>
salesforce accounts create --name <name> [--type <type>] [--industry <industry>] [--phone <phone>] [--website <url>] [--revenue <amount>]
salesforce accounts update <id> [--name <name>] [--type <type>] [--industry <industry>]
salesforce accounts delete <id>
salesforce accounts search --where <condition>
salesforce accounts describe
```

#### Contacts
```bash
salesforce contacts list [--where <condition>] [--limit <n>]
salesforce contacts get <id>
salesforce contacts create --last-name <name> [--first-name <name>] [--email <email>] [--phone <phone>] [--title <title>] [--account-id <id>]
salesforce contacts update <id> [--email <email>] [--phone <phone>] [--title <title>]
salesforce contacts delete <id>
salesforce contacts search --where <condition>
salesforce contacts describe
```

#### Leads
```bash
salesforce leads list [--where <condition>] [--limit <n>]
salesforce leads get <id>
salesforce leads create --last-name <name> --company <company> [--first-name <name>] [--email <email>] [--status <status>] [--source <source>]
salesforce leads update <id> [--status <status>] [--email <email>]
salesforce leads delete <id>
salesforce leads search --where <condition>
salesforce leads describe
```

#### Opportunities
```bash
salesforce opportunities list [--where <condition>] [--limit <n>]
salesforce opportunities get <id>
salesforce opportunities create --name <name> --stage <stage> --close-date <YYYY-MM-DD> [--amount <n>] [--account-id <id>]
salesforce opportunities update <id> [--stage <stage>] [--amount <n>] [--close-date <date>]
salesforce opportunities delete <id>
salesforce opportunities search --where <condition>
salesforce opportunities describe
```

#### Cases
```bash
salesforce cases list [--where <condition>] [--limit <n>]
salesforce cases get <id>
salesforce cases create --subject <text> [--status <status>] [--priority <priority>] [--origin <origin>] [--account-id <id>] [--contact-id <id>]
salesforce cases update <id> [--status <status>] [--priority <priority>]
salesforce cases delete <id>
salesforce cases search --where <condition>
salesforce cases describe
```

#### Tasks
```bash
salesforce tasks list [--where <condition>] [--limit <n>]
salesforce tasks get <id>
salesforce tasks create --subject <text> [--status <status>] [--priority <priority>] [--due-date <YYYY-MM-DD>] [--who-id <contact_lead_id>] [--what-id <opportunity_case_id>]
salesforce tasks update <id> [--status <status>] [--priority <priority>]
salesforce tasks delete <id>
salesforce tasks search --where <condition>
salesforce tasks describe
```

#### Events
```bash
salesforce events list [--where <condition>] [--limit <n>]
salesforce events get <id>
salesforce events create --subject <text> --start-datetime <ISO8601> --end-datetime <ISO8601> [--location <text>] [--who-id <id>] [--what-id <id>]
salesforce events update <id> [--subject <text>] [--start-datetime <ISO8601>] [--end-datetime <ISO8601>]
salesforce events delete <id>
salesforce events search --where <condition>
salesforce events describe
```

#### Campaigns
```bash
salesforce campaigns list [--where <condition>] [--limit <n>]
salesforce campaigns get <id>
salesforce campaigns create --name <name> [--type <type>] [--status <status>] [--start-date <date>] [--end-date <date>] [--budget <n>]
salesforce campaigns update <id> [--status <status>] [--budget <n>]
salesforce campaigns delete <id>
salesforce campaigns search --where <condition>
salesforce campaigns describe
```

#### Users
```bash
salesforce users list [--where <condition>] [--limit <n>]
salesforce users get <id>
salesforce users create --username <email> --last-name <name> --email <email> --profile-id <id> [--first-name <name>]
salesforce users update <id> [--is-active <bool>] [--title <title>]
salesforce users delete <id>
salesforce users search --where <condition>
salesforce users describe
```

---

### SOQL Query

```bash
salesforce query run --soql "<SOQL>"
salesforce query explain --soql "<SOQL>"     # Get query execution plan
salesforce query more --url "<nextRecordsUrl>"  # Paginate large result sets
```

**SOQL cheat sheet:**
```sql
-- Filter
SELECT Id, Name FROM Account WHERE Industry = 'Technology' LIMIT 10

-- Date literals (no quotes)
WHERE CreatedDate = TODAY
WHERE CloseDate = THIS_QUARTER
WHERE ActivityDate = LAST_N_DAYS:30

-- Relationships
SELECT Account.Name, LastName FROM Contact WHERE Account.Industry = 'Finance'

-- Aggregates
SELECT StageName, COUNT(Id), SUM(Amount) FROM Opportunity GROUP BY StageName

-- Subqueries
SELECT Name, (SELECT LastName FROM Contacts) FROM Account

-- Semi-join
SELECT Id FROM Contact WHERE AccountId IN (SELECT Id FROM Account WHERE Industry = 'Tech')
```

---

### SOSL Search

```bash
salesforce search run --sosl "<SOSL>"
salesforce search suggest --text <text> --sobject <type>
```

**SOSL example:**
```bash
salesforce search run --sosl "FIND {Acme} IN ALL FIELDS RETURNING Account(Id, Name), Contact(Id, Name, Email)"
```

---

### Generic SObject Operations

Use for any SObject type, including custom objects (`__c` suffix):

```bash
salesforce sobjects list                                         # All types in org
salesforce sobjects describe <type>                             # Full metadata + fields
salesforce sobjects metadata <type>                             # Lightweight metadata
salesforce sobjects get <type> <id>                             # Get any record
salesforce sobjects create <type> --data '<json>'               # Create with JSON
salesforce sobjects update <type> <id> --data '<json>'          # Update with JSON
salesforce sobjects delete <type> <id>                          # Delete
salesforce sobjects upsert <type> --external-field <f> --external-value <v> --data '<json>'
```

**Example — custom object:**
```bash
salesforce sobjects describe CustomApp__c
salesforce sobjects create CustomApp__c --data '{"Name":"Test","Status__c":"Active"}'
```

---

### Bulk API 2.0

For 200+ record operations. All jobs are asynchronous.

```bash
# Ingest (insert/update/upsert/delete/hardDelete)
salesforce bulk ingest-create --sobject <type> --operation <insert|update|upsert|delete|hardDelete>
salesforce bulk ingest-upload --job-id <id> --csv "<csv_data>"
salesforce bulk ingest-close --job-id <id>
salesforce bulk ingest-status --job-id <id>
salesforce bulk ingest-results --job-id <id> [--type successful|failed|unprocessed]
salesforce bulk ingest-abort --job-id <id>
salesforce bulk ingest-list

# Query (async SOQL for large result sets)
salesforce bulk query-create --soql "<SOQL>"
salesforce bulk query-status --job-id <id>
salesforce bulk query-results --job-id <id>
```

**Decision rule:** Use Bulk API when record count > 200. Use regular CRUD for smaller operations.

---

### Composite API

Multiple API operations in a single HTTP round-trip.

```bash
# Composite — supports @{referenceId} cross-request references (up to 25 subrequests)
salesforce composite run --requests '<json_array>'

# Batch — independent subrequests (up to 25, no references)
salesforce composite batch --requests '<json_array>'

# Tree — parent + children records in one call
salesforce composite tree --sobject <type> --records '<json_array>'

# Collections — up to 200 records, single operation
salesforce composite collection --method <create|update|upsert|delete> --records '<json_array>'
```

**Example — create Account + Contact atomically:**
```bash
salesforce composite run --requests '[
  {"method":"POST","url":"/services/data/v62.0/sobjects/Account","referenceId":"acc","body":{"Name":"Acme"}},
  {"method":"POST","url":"/services/data/v62.0/sobjects/Contact","referenceId":"con","body":{"LastName":"Smith","AccountId":"@{acc.id}"}}
]'
```

---

### Reports & Dashboards

```bash
salesforce reports list
salesforce reports get <id>
salesforce reports run <id>
salesforce reports dashboards-list
salesforce reports dashboards-get <id>
```

---

### Apex

```bash
salesforce apex execute --code "<apex_code>"
salesforce apex rest --path "<endpoint_path>" --method <GET|POST|PUT|DELETE> [--body '<json>']
salesforce apex test-run --class-ids "<id1,id2>"
salesforce apex test-results --run-id <id>
```

---

### Limits & Metadata

```bash
salesforce limits get        # API call limits, storage, other org limits
salesforce limits versions   # Available API versions
salesforce limits resources  # All REST API resource URLs
```

---

## Decision Guide for Agents

### Which command to use?

| Scenario | Command |
|----------|---------|
| Read/write a known record type (Account, Contact, etc.) | `salesforce accounts/contacts/...` |
| Work with a custom object or unknown type | `salesforce sobjects <type>` |
| Complex query with JOINs, aggregates, filters | `salesforce query run --soql` |
| Search for text across multiple objects | `salesforce search run --sosl` |
| Create related records atomically | `salesforce composite run` |
| Insert/update/delete 200+ records | `salesforce bulk ingest-create` |
| Execute business logic or trigger workflows | `salesforce apex execute` |
| Unknown object structure | `salesforce sobjects describe <type>` |
| Check remaining API quota | `salesforce limits get` |

### Key rules

1. **Describe before you write.** When working with unfamiliar or custom objects, always run `sobjects describe` first to get field names, types, and picklist values.
2. **Filter server-side.** Use `--where` and `--soql` WHERE clauses rather than fetching all records and filtering locally.
3. **Use Composite for related records.** Creating Account + Contact + Opportunity together? One `composite run` beats three round-trips — and supports rollback via `allOrNone`.
4. **Bulk API for volume.** Regular CRUD has per-call overhead. Use bulk jobs when inserting, updating, or deleting more than 200 records.
5. **Check limits before big jobs.** Run `limits get` before bulk operations to confirm you have API calls remaining.
6. **Custom objects use `__c` suffix.** API names differ from labels: `Custom Object` → `Custom_Object__c`, `Custom Field` → `Custom_Field__c`.
7. **Record IDs are 15 or 18 characters.** Both work; 18-char is case-insensitive and preferred for external systems.
8. **Date literals avoid timezone issues.** Use `TODAY`, `THIS_WEEK`, `THIS_QUARTER`, `LAST_N_DAYS:30` in SOQL instead of hardcoded dates.
9. **Upsert for idempotency.** Use `sobjects upsert` with external IDs when you need to create-or-update without checking existence first.
10. **Use `--fields` to reduce noise.** Select only the fields you need rather than returning full records.

### Common mistakes to avoid

- **Don't use `delete` on required relationships.** Deleting an Account that has Contacts will fail — delete children first or use `hardDelete` in bulk.
- **SOQL strings must be URL-safe.** The CLI handles encoding, but avoid unescaped single quotes in `--soql` values. Use `\'` inside strings.
- **Bulk jobs are async.** After `ingest-close`, poll `ingest-status` until `state` is `JobComplete` before fetching results.
- **Composite `allOrNone` behavior.** By default, composite requests stop on first error. Add `"allOrNone": false` in your request body to process all subrequests independently.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SALESFORCE_ACCESS_TOKEN` | OAuth access token |
| `SALESFORCE_INSTANCE_URL` | Org URL (e.g., `https://myorg.salesforce.com`) |
| `SF_ACCESS_TOKEN` | Alias for `SALESFORCE_ACCESS_TOKEN` |
| `SF_INSTANCE_URL` | Alias for `SALESFORCE_INSTANCE_URL` |
| `SALESFORCE_API_VERSION` | Override default API version (default: `v62.0`) |

---

## Error Codes

All errors return JSON to stderr: `{ "error": "<message>", "code": "<CODE>" }`

| Code | Meaning |
|------|---------|
| `AUTH_ERROR` | Missing or invalid access token |
| `NOT_FOUND` | Record or resource not found (404) |
| `VALIDATION_ERROR` | Invalid input — check field names and types |
| `RATE_LIMIT` | API limit hit — check `limits get` |
| `SERVER_ERROR` | Salesforce API error — check error message |
