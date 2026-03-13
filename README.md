# salesforce-crm-cli

> A JSON-first CLI and MCP server for the Salesforce REST API — built for humans and AI agents alike.

[![npm version](https://img.shields.io/npm/v/salesforce-crm-cli)](https://www.npmjs.com/package/salesforce-crm-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

**102 commands across 20 command groups.** Every command works as both a CLI subcommand and an MCP tool — defined once, registered everywhere.

```bash
npm install -g salesforce-crm-cli
salesforce --help
```

---

## What This Is

The official Salesforce CLI (`sf`/`sfdx`) is a developer toolchain for deploying Apex code, managing orgs, and CI/CD. **This is different.**

`salesforce-crm-cli` is purpose-built for **CRM data operations and AI agent integration**:

- Query accounts, contacts, leads, opportunities via SOQL/SOSL
- Create, update, delete any Salesforce record
- Run Bulk API 2.0 jobs for mass data operations
- Execute composite requests and record trees in a single API call
- Run anonymous Apex and call Apex REST endpoints
- Expose every command as an MCP tool for Claude, Cursor, and other AI agents

All output is JSON. No spinners, no prompts, no noise — optimized for piping and agent consumption.

---

## Quick Start

### Install

```bash
npm install -g salesforce-crm-cli
```

### Authenticate

**Option A — Access Token (fastest)**
```bash
salesforce login \
  --access-token <your_token> \
  --instance-url https://yourorg.salesforce.com
```

**Option B — OAuth Username/Password Flow**
```bash
salesforce login \
  --client-id <connected_app_consumer_key> \
  --username <you@yourorg.com> \
  --password <password+security_token>
```

**Option C — Environment Variables**
```bash
export SALESFORCE_ACCESS_TOKEN="your_token"
export SALESFORCE_INSTANCE_URL="https://yourorg.salesforce.com"
salesforce status
```

### Verify
```bash
salesforce status        # Show current auth info
salesforce limits get    # Check API limits for your org
```

---

## Authentication

Auth is resolved in priority order:

| Priority | Method | How |
|----------|--------|-----|
| 1 (highest) | CLI flags | `--access-token`, `--instance-url` |
| 2 | Environment variables | `SALESFORCE_ACCESS_TOKEN` + `SALESFORCE_INSTANCE_URL` (or `SF_ACCESS_TOKEN` + `SF_INSTANCE_URL`) |
| 3 | Stored config | `~/.salesforce-cli/config.json` (set by `salesforce login`) |

---

## Command Groups

### Core CRM Objects

Each object has 7 commands: `list`, `get`, `create`, `update`, `delete`, `search`, `describe`

| Group | Salesforce Object | Key Fields |
|-------|------------------|------------|
| `accounts` | Account | Name, Type, Industry, Phone, Website, AnnualRevenue |
| `contacts` | Contact | FirstName, LastName, Email, Phone, Title, AccountId |
| `leads` | Lead | FirstName, LastName, Company, Email, Status, LeadSource |
| `opportunities` | Opportunity | Name, StageName, Amount, CloseDate, AccountId |
| `cases` | Case | Subject, Status, Priority, Origin, ContactId, AccountId |
| `tasks` | Task | Subject, Status, Priority, ActivityDate, WhoId, WhatId |
| `events` | Event | Subject, StartDateTime, EndDateTime, Location, WhoId |
| `campaigns` | Campaign | Name, Type, Status, StartDate, EndDate, BudgetedCost |
| `users` | User | Username, Name, Email, IsActive, ProfileId |

```bash
# Examples
salesforce accounts list --limit 10 --pretty
salesforce contacts get 003xx000004TNEAAA4
salesforce leads create --first-name "Jane" --last-name "Doe" --company "Acme" --email "jane@acme.com"
salesforce opportunities update 006xx000001TNEAAA4 --stage "Closed Won" --amount "75000"
salesforce accounts describe --pretty
```

### Query & Search

```bash
# SOQL
salesforce query run --soql "SELECT Id, Name, Amount FROM Opportunity WHERE StageName = 'Prospecting'"
salesforce query explain --soql "SELECT Id FROM Lead WHERE CreatedDate = TODAY"
salesforce query more --url "/services/data/v62.0/query/01gxx000000..."

# SOSL
salesforce search run --sosl "FIND {Acme} IN ALL FIELDS RETURNING Account(Id, Name), Contact(Id, Name)"
salesforce search suggest --text "Acme" --sobject Account
```

### Generic SObject Operations

Work with any SObject type — including custom objects (`CustomObject__c`):

```bash
salesforce sobjects list                                    # All SObject types in org
salesforce sobjects describe CustomObject__c               # Full metadata + field list
salesforce sobjects get CustomObject__c a00xx000000001AAA  # Get by record ID
salesforce sobjects create CustomObject__c --data '{"Name":"Test","Custom_Field__c":"value"}'
salesforce sobjects update CustomObject__c a00xx000000001AAA --data '{"Custom_Field__c":"updated"}'
salesforce sobjects delete CustomObject__c a00xx000000001AAA
salesforce sobjects upsert CustomObject__c --external-field "External_Id__c" --external-value "EXT-001" --data '{"Name":"Test"}'
```

### Bulk API 2.0

For mass data operations (200+ records):

```bash
# Create an ingest job
salesforce bulk ingest-create --sobject Account --operation insert

# Upload CSV
salesforce bulk ingest-upload --job-id 7500x000000xxxxAAA \
  --csv "Name,Industry\nAcme Corp,Technology\nGlobex Inc,Finance"

# Process the job
salesforce bulk ingest-close --job-id 7500x000000xxxxAAA

# Monitor
salesforce bulk ingest-status --job-id 7500x000000xxxxAAA
salesforce bulk ingest-results --job-id 7500x000000xxxxAAA --type successful

# Bulk query
salesforce bulk query-create --soql "SELECT Id, Name FROM Account"
salesforce bulk query-status --job-id 7500x000000xxxxAAA
salesforce bulk query-results --job-id 7500x000000xxxxAAA
```

### Composite API

Multiple API calls in a single HTTP request:

```bash
# Composite — supports cross-request references
salesforce composite run --requests '[
  {"method":"POST","url":"/services/data/v62.0/sobjects/Account","referenceId":"newAccount","body":{"Name":"Acme Corp"}},
  {"method":"POST","url":"/services/data/v62.0/sobjects/Contact","referenceId":"newContact","body":{"LastName":"Smith","AccountId":"@{newAccount.id}"}}
]'

# Batch — independent requests
salesforce composite batch --requests '[
  {"method":"GET","url":"/services/data/v62.0/sobjects/Account/001xx000003GYQ"},
  {"method":"GET","url":"/services/data/v62.0/sobjects/Contact/003xx000004TNE"}
]'

# Tree — parent + children in one call
salesforce composite tree --sobject Account --records '[
  {"attributes":{"type":"Account"},"Name":"Parent Corp","Contacts":{"records":[
    {"attributes":{"type":"Contact"},"LastName":"Smith"}
  ]}}
]'

# Collections — up to 200 records in one call
salesforce composite collection --method create --records '[
  {"attributes":{"type":"Lead"},"LastName":"Jones","Company":"ACME"},
  {"attributes":{"type":"Lead"},"LastName":"Brown","Company":"Globex"}
]'
```

### Reports & Dashboards

```bash
salesforce reports list --pretty
salesforce reports get 00Oxx0000001AAAAAA
salesforce reports run 00Oxx0000001AAAAAA --pretty
salesforce reports dashboards-list
salesforce reports dashboards-get 01Zxx0000001AAAAAA
```

### Apex

```bash
# Execute anonymous Apex
salesforce apex execute --code "System.debug('Hello World');"

# Call custom Apex REST endpoint
salesforce apex rest --path "/MyEndpoint/action" --method POST --body '{"key":"value"}'

# Run tests
salesforce apex test-run --class-ids "01pxx000000001AAA,01pxx000000002AAA"
salesforce apex test-results --run-id 707xx0000000001AAA
```

### Limits & Metadata

```bash
salesforce limits get --pretty         # API limits and current usage
salesforce limits versions             # All supported API versions
salesforce limits resources            # All available REST resources
```

---

## Output Flags

All commands output JSON. Control the format with:

| Flag | Description |
|------|-------------|
| `--pretty` | Pretty-print JSON with indentation |
| `--quiet` | Suppress output (exit code only) |
| `--fields <fields>` | Select specific fields (comma-separated) |
| `--output <format>` | `json` (default) or `pretty` |

---

## Global Options

Available on every command:

| Flag | Description |
|------|-------------|
| `--access-token <token>` | Override stored access token |
| `--instance-url <url>` | Override stored instance URL |
| `--api-version <version>` | API version (default: `v62.0`) |
| `--pretty` | Pretty-print JSON output |
| `--quiet` | Suppress all output |
| `--fields <fields>` | Select specific response fields |

---

## MCP Server Setup

Use `salesforce-crm-cli` as an MCP server to give AI agents (Claude, Cursor, etc.) direct Salesforce access.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["salesforce-crm-cli", "mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token-here",
        "SALESFORCE_INSTANCE_URL": "https://yourorg.salesforce.com"
      }
    }
  }
}
```

### Cursor / VS Code

Add to `.cursor/mcp.json` or `.vscode/mcp.json` in your project:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["salesforce-crm-cli", "mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token-here",
        "SALESFORCE_INSTANCE_URL": "https://yourorg.salesforce.com"
      }
    }
  }
}
```

### Using Global Install

If installed globally (`npm install -g salesforce-crm-cli`):

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "salesforce",
      "args": ["mcp"],
      "env": {
        "SALESFORCE_ACCESS_TOKEN": "your-token-here",
        "SALESFORCE_INSTANCE_URL": "https://yourorg.salesforce.com"
      }
    }
  }
}
```

Once connected, all 102 commands are available as MCP tools. The agent can query accounts, create leads, run SOQL, trigger Apex, and more — all with full type validation on every input.

---

## Common Workflows

### Find an Account and All Its Contacts

```bash
# Search by name
salesforce accounts search --where "Name LIKE '%Acme%'"

# Get all contacts for that account
salesforce contacts list --where "AccountId = '001xx000003GYQIAA4'"
```

### Lead-to-Opportunity Pipeline

```bash
# Create a lead
salesforce leads create --first-name "Jane" --last-name "Doe" \
  --company "Acme Corp" --email "jane@acme.com" --source "Web"

# Convert by creating opportunity
salesforce opportunities create --name "Acme Corp — Enterprise" \
  --stage "Prospecting" --close-date "2026-06-30" \
  --amount "75000" --account-id "001xx000003GYQIAA4"

# Create a follow-up task
salesforce tasks create --subject "Discovery call with Jane" \
  --due-date "2026-04-01" --priority "High" \
  --what-id "<opportunity_id>"
```

### Bulk Import Contacts from CSV

```bash
salesforce bulk ingest-create --sobject Contact --operation insert
salesforce bulk ingest-upload --job-id <JOB_ID> \
  --csv "FirstName,LastName,Email,AccountId\nJane,Doe,jane@acme.com,001xx000003GYQ\nJohn,Smith,john@globex.com,001xx000003GYR"
salesforce bulk ingest-close --job-id <JOB_ID>
salesforce bulk ingest-status --job-id <JOB_ID>
```

### Complex SOQL Analytics

```bash
# Opportunities by stage with totals
salesforce query run --soql \
  "SELECT StageName, COUNT(Id) Total, SUM(Amount) TotalAmount \
   FROM Opportunity \
   WHERE CloseDate = THIS_QUARTER \
   GROUP BY StageName \
   ORDER BY SUM(Amount) DESC" --pretty

# Accounts with 5+ contacts
salesforce query run --soql \
  "SELECT Account.Name, COUNT(Id) ContactCount \
   FROM Contact \
   GROUP BY Account.Name \
   HAVING COUNT(Id) >= 5 \
   ORDER BY COUNT(Id) DESC \
   LIMIT 20"
```

### Describe a Custom Object

```bash
salesforce sobjects describe MyCustomObject__c --pretty
# Returns all fields, types, picklist values, relationships, and metadata
```

---

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander.js)
├── mcp.ts                # MCP server entry point
├── core/
│   ├── types.ts          # CommandDefinition — single source of truth
│   ├── client.ts         # HTTP client (retry, rate-limit, timeout)
│   ├── auth.ts           # Token + instance URL resolution
│   ├── config.ts         # ~/.salesforce-cli/config.json
│   ├── errors.ts         # Error hierarchy
│   ├── handler.ts        # Command → HTTP executor
│   └── output.ts         # JSON output formatting
├── factories/
│   └── sobject.ts        # Generates 7 commands per SObject type
├── commands/             # 20 command groups
│   ├── accounts/
│   ├── contacts/
│   ├── leads/
│   └── ...
└── mcp/
    └── server.ts         # Registers all commands as MCP tools
```

**Key design principle:** Every command is defined once as a `CommandDefinition` and automatically registered as both a CLI subcommand and an MCP tool. Adding a command group requires creating one file and one line in `commands/index.ts`.

---

## Adding Custom SObject Commands

Create `src/commands/your-object/index.ts`:

```typescript
import { createSObjectCommands } from '../../factories/sobject.js';

export const allYourObjectCommands = createSObjectCommands({
  objectType: 'YourObject__c',
  group: 'your-object',
  singular: 'your object',
  defaultFields: ['Id', 'Name', 'CreatedDate'],
  writeProperties: [
    { field: 'Name', flags: '-n, --name <name>', description: 'Name', required: true },
    { field: 'Custom_Field__c', flags: '--custom-field <value>', description: 'Custom field' },
  ],
});
```

Then add to `src/commands/index.ts`:

```typescript
import { allYourObjectCommands } from './your-object/index.js';
// ...
export const allCommands: CommandDefinition[] = [
  ...allYourObjectCommands,
  // rest of commands
];
```

This gives you `list`, `get`, `create`, `update`, `delete`, `search`, and `describe` for your object automatically.

---

## Development

```bash
git clone https://github.com/bcharleson/salesforce-crm-cli
cd salesforce-crm-cli
npm install

# Run in dev mode
npm run dev -- accounts list --pretty

# Type check
npm run typecheck

# Build
npm run build

# Test
npm test
```

---

## SOQL Quick Reference

```sql
-- Basic
SELECT Id, Name FROM Account WHERE Industry = 'Technology' LIMIT 10

-- Date literals (no quotes needed)
SELECT Id FROM Lead WHERE CreatedDate = TODAY
SELECT Id FROM Opportunity WHERE CloseDate = THIS_QUARTER
SELECT Id FROM Task WHERE ActivityDate = LAST_N_DAYS:7

-- Relationships (dot notation)
SELECT Account.Name, LastName, Email FROM Contact WHERE Account.Industry = 'Finance'

-- Aggregates
SELECT StageName, COUNT(Id), SUM(Amount) FROM Opportunity GROUP BY StageName

-- Subqueries
SELECT Name, (SELECT LastName, Email FROM Contacts) FROM Account WHERE AnnualRevenue > 1000000

-- IN / NOT IN
SELECT Id FROM Contact WHERE AccountId IN (SELECT Id FROM Account WHERE Industry = 'Tech')
```

---

## Tech Stack

- **TypeScript** (ESM, strict mode)
- **Commander.js 14** — CLI framework
- **Zod 3** — input validation for all commands
- **@modelcontextprotocol/sdk** — MCP server
- **tsup** — build, **tsx** — dev, **vitest** — tests
- **Node 18+**

---

## License

MIT — [Brandon Charleson](https://github.com/bcharleson)
