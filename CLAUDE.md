# Salesforce CLI — Developer Guide

## Overview

JSON-first CLI + MCP server for the Salesforce REST API. Every command is defined once as a `CommandDefinition` and automatically registers as both a CLI subcommand (Commander.js) and an MCP tool.

## Architecture

```
src/
├── index.ts              # CLI entry point (Commander.js)
├── mcp.ts                # Direct MCP entry point
├── core/
│   ├── types.ts          # CommandDefinition, SalesforceClient interface, config types
│   ├── client.ts         # HTTP client with retry, rate-limit handling, timeout
│   ├── auth.ts           # Token + instance URL resolution (flag > env > config)
│   ├── config.ts         # ~/.salesforce-cli/config.json management
│   ├── errors.ts         # Error hierarchy (Auth, NotFound, Validation, RateLimit, Server)
│   ├── handler.ts        # Generic command → HTTP request executor
│   └── output.ts         # JSON output with --pretty, --quiet, --fields
├── factories/
│   └── sobject.ts        # Factory: generates 7 commands per SObject type
├── commands/
│   ├── index.ts          # allCommands array + registerAllCommands()
│   ├── auth/             # login, logout, status (special — no API client)
│   ├── mcp/              # MCP server launcher command
│   ├── accounts/         # Account CRUD (factory-generated)
│   ├── contacts/         # Contact CRUD
│   ├── leads/            # Lead CRUD
│   ├── opportunities/    # Opportunity CRUD
│   ├── cases/            # Case CRUD
│   ├── tasks/            # Task CRUD
│   ├── events/           # Event CRUD
│   ├── campaigns/        # Campaign CRUD
│   ├── users/            # User CRUD
│   ├── query/            # SOQL query, explain, pagination
│   ├── search/           # SOSL search, suggestions
│   ├── sobjects/         # Generic SObject ops (any type)
│   ├── bulk/             # Bulk API 2.0 (ingest + query jobs)
│   ├── composite/        # Composite, batch, tree, collections
│   ├── reports/          # Analytics reports + dashboards
│   ├── apex/             # Anonymous Apex, REST endpoints, tests
│   └── limits/           # API limits, versions, resources
└── mcp/
    └── server.ts         # MCP server (registers all commands as tools)
```

## Key Patterns

### CommandDefinition (core/types.ts)
Single source of truth for each command:
- `name`: MCP tool name (e.g., `accounts_list`)
- `group`: CLI group (e.g., `accounts`)
- `subcommand`: CLI subcommand (e.g., `list`)
- `inputSchema`: Zod schema (validates CLI + MCP input)
- `cliMappings`: Maps Zod fields → CLI args/options
- `endpoint`: HTTP method + path template
- `fieldMappings`: Routes fields to path/query/body
- `handler`: The actual execution function

### SObject Factory (factories/sobject.ts)
Generates 7 commands for any Salesforce SObject:
1. **list** — SOQL query with default fields
2. **get** — by record ID
3. **create** — with typed field options
4. **update** — by ID with field options
5. **delete** — by ID
6. **search** — SOQL WHERE or SOSL
7. **describe** — full object metadata

### Salesforce API Specifics

- **Base URL:** `{instance_url}/services/data/{api_version}/`
- **Auth:** Bearer token in Authorization header
- **API Version:** v62.0 (configurable via `--api-version`)
- **Error format:** Array of `[{ message, errorCode, fields }]`
- **SObject CRUD:** `/sobjects/{Type}` (create), `/sobjects/{Type}/{id}` (get/update/delete)
- **SOQL:** `/query?q=<SOQL>`
- **SOSL:** `/search?q=<SOSL>`
- **Bulk API 2.0:** `/jobs/ingest`, `/jobs/query`
- **Composite:** `/composite`, `/composite/batch`, `/composite/tree/{type}`
- **Rate limits:** Edition-dependent daily limits, check via `/limits`

## Tech Stack

- TypeScript ESM (type: "module")
- Node 18+
- Commander.js 14 (CLI framework)
- Zod 3 (input validation)
- @modelcontextprotocol/sdk (MCP server)
- tsup (build), tsx (dev), vitest (test)

## Development

```bash
npm install
npm run dev -- accounts list        # Run in dev mode
npm run build                       # Build for production
npm run typecheck                   # Type checking
npm test                            # Run tests
```

## Adding New Commands

### Factory-generated SObject (easiest)
Create `src/commands/{group}/index.ts`:
```typescript
import { createSObjectCommands } from '../../factories/sobject.js';
export const allXxxCommands = createSObjectCommands({
  objectType: 'CustomObject__c',
  group: 'custom-objects',
  singular: 'custom object',
  defaultFields: ['Id', 'Name', 'CreatedDate'],
  writeProperties: [
    { field: 'Name', flags: '-n, --name <name>', description: 'Name', required: true },
  ],
});
```

### Custom commands
Create `src/commands/{group}/index.ts` with a `CommandDefinition[]` array.

### Register
Add the import + spread to `allCommands` in `src/commands/index.ts`.

## Conventions

- Zod validates ALL input before API call
- Unknown subcommand → error with available commands listed
- JSON output always (never plain text)
- MCP tools have parity with CLI commands
- Errors include `{ error, code }` JSON on stderr
