import { z } from 'zod';
import type { CommandDefinition, SalesforceClient, SalesforceQueryResponse } from '../core/types.js';
import { executeCommand } from '../core/handler.js';

interface SObjectConfig {
  /** API name of the SObject: "Account", "Contact", "Lead" */
  objectType: string;

  /** CLI group name (lowercase): "accounts", "contacts", "leads" */
  group: string;

  /** Singular CLI name: "account", "contact", "lead" */
  singular: string;

  /** Default fields to return in SOQL queries */
  defaultFields: string[];

  /** Writable fields for create/update */
  writeProperties: Array<{
    field: string;
    flags: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * Factory: generates list, get, create, update, delete, search commands
 * for any Salesforce SObject type.
 */
export function createSObjectCommands(config: SObjectConfig): CommandDefinition[] {
  const { objectType, group, singular, defaultFields, writeProperties } = config;

  // ── LIST (via SOQL) ──────────────────────────────────────
  const listCommand: CommandDefinition = {
    name: `${group}_list`,
    group,
    subcommand: 'list',
    description: `List ${group}. Returns records via SOQL with default fields.`,
    examples: [
      `salesforce ${group} list`,
      `salesforce ${group} list --limit 50`,
      `salesforce ${group} list --fields "Id,Name,CreatedDate"`,
      `salesforce ${group} list --where "CreatedDate = TODAY"`,
    ],

    inputSchema: z.object({
      limit: z.coerce.number().min(1).max(2000).default(100).describe('Max records to return (1-2000)'),
      fields: z.string().optional().describe('Comma-separated fields to return'),
      where: z.string().optional().describe('SOQL WHERE clause (without WHERE keyword)'),
      orderBy: z.string().optional().describe('SOQL ORDER BY clause'),
    }),

    cliMappings: {
      options: [
        { field: 'limit', flags: '-l, --limit <number>', description: 'Max records (1-2000)' },
        { field: 'fields', flags: '-f, --fields <fields>', description: 'Comma-separated fields' },
        { field: 'where', flags: '-w, --where <clause>', description: 'SOQL WHERE clause' },
        { field: 'orderBy', flags: '--order-by <clause>', description: 'ORDER BY clause' },
      ],
    },

    endpoint: { method: 'GET', path: '/query' },
    fieldMappings: {},
    paginated: true,

    handler: async (input, client) => {
      const selectedFields = input.fields
        ? input.fields.split(',').map((f: string) => f.trim()).join(', ')
        : defaultFields.join(', ');

      let soql = `SELECT ${selectedFields} FROM ${objectType}`;
      if (input.where) soql += ` WHERE ${input.where}`;
      if (input.orderBy) soql += ` ORDER BY ${input.orderBy}`;
      soql += ` LIMIT ${input.limit}`;

      return client.get<SalesforceQueryResponse>('/query', { q: soql });
    },
  };

  // ── GET ──────────────────────────────────────────────────
  const getCommand: CommandDefinition = {
    name: `${group}_get`,
    group,
    subcommand: 'get',
    description: `Get a ${singular} by ID.`,
    examples: [
      `salesforce ${group} get <id>`,
      `salesforce ${group} get <id> --fields "Id,Name,Email"`,
    ],

    inputSchema: z.object({
      id: z.string().describe(`${singular} record ID`),
      fields: z.string().optional().describe('Comma-separated fields to return'),
    }),

    cliMappings: {
      args: [{ field: 'id', name: 'id', required: true }],
      options: [
        { field: 'fields', flags: '-f, --fields <fields>', description: 'Fields to return' },
      ],
    },

    endpoint: { method: 'GET', path: `/sobjects/${objectType}/{id}` },
    fieldMappings: { id: 'path', fields: 'query' },

    handler: (input, client) => {
      const query: Record<string, string> = {};
      if (input.fields) {
        query.fields = input.fields;
      }
      return client.get(`/sobjects/${objectType}/${encodeURIComponent(input.id)}`, query);
    },
  };

  // ── CREATE ───────────────────────────────────────────────
  const createSchema: Record<string, z.ZodTypeAny> = {};
  const createOptions: Array<{ field: string; flags: string; description: string }> = [];
  const createFieldMappings: Record<string, 'body'> = {};

  for (const prop of writeProperties) {
    createSchema[prop.field] = prop.required
      ? z.string().describe(prop.description)
      : z.string().optional().describe(prop.description);
    createOptions.push({ field: prop.field, flags: prop.flags, description: prop.description });
    createFieldMappings[prop.field] = 'body';
  }

  const createCommand: CommandDefinition = {
    name: `${group}_create`,
    group,
    subcommand: 'create',
    description: `Create a new ${singular}.`,
    examples: [
      `salesforce ${group} create ${writeProperties.slice(0, 2).map(p => `${p.flags.split('<')[0].trim().split(',').pop()?.trim()} "value"`).join(' ')}`,
    ],

    inputSchema: z.object(createSchema),
    cliMappings: { options: createOptions },
    endpoint: { method: 'POST', path: `/sobjects/${objectType}` },
    fieldMappings: createFieldMappings,

    handler: (input, client) => {
      // Salesforce expects flat body for SObject create (no wrapper)
      const body: Record<string, any> = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) body[key] = value;
      }
      return client.post(`/sobjects/${objectType}`, body);
    },
  };

  // ── UPDATE ───────────────────────────────────────────────
  const updateSchema: Record<string, z.ZodTypeAny> = {
    id: z.string().describe(`${singular} record ID`),
  };
  const updateOptions: Array<{ field: string; flags: string; description: string }> = [];

  for (const prop of writeProperties) {
    updateSchema[prop.field] = z.string().optional().describe(prop.description);
    updateOptions.push({ field: prop.field, flags: prop.flags, description: prop.description });
  }

  const updateCommand: CommandDefinition = {
    name: `${group}_update`,
    group,
    subcommand: 'update',
    description: `Update an existing ${singular} by ID.`,
    examples: [
      `salesforce ${group} update <id> ${writeProperties[0]?.flags.split('<')[0].trim().split(',').pop()?.trim()} "new value"`,
    ],

    inputSchema: z.object(updateSchema),
    cliMappings: {
      args: [{ field: 'id', name: 'id', required: true }],
      options: updateOptions,
    },
    endpoint: { method: 'PATCH', path: `/sobjects/${objectType}/{id}` },
    fieldMappings: { id: 'path' },

    handler: async (input, client) => {
      const { id, ...fields } = input;
      const body: Record<string, any> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) body[key] = value;
      }
      await client.patch(`/sobjects/${objectType}/${encodeURIComponent(id)}`, body);
      return { status: 'updated', id };
    },
  };

  // ── DELETE ───────────────────────────────────────────────
  const deleteCommand: CommandDefinition = {
    name: `${group}_delete`,
    group,
    subcommand: 'delete',
    description: `Delete a ${singular} by ID.`,
    examples: [`salesforce ${group} delete <id>`],

    inputSchema: z.object({
      id: z.string().describe(`${singular} record ID`),
    }),

    cliMappings: {
      args: [{ field: 'id', name: 'id', required: true }],
    },

    endpoint: { method: 'DELETE', path: `/sobjects/${objectType}/{id}` },
    fieldMappings: { id: 'path' },

    handler: async (input, client) => {
      await client.delete(`/sobjects/${objectType}/${encodeURIComponent(input.id)}`);
      return { status: 'deleted', id: input.id };
    },
  };

  // ── SEARCH (via SOQL) ───────────────────────────────────
  const searchCommand: CommandDefinition = {
    name: `${group}_search`,
    group,
    subcommand: 'search',
    description: `Search ${group} using a SOQL WHERE clause or SOSL text search.`,
    examples: [
      `salesforce ${group} search --where "Name LIKE '%Acme%'"`,
      `salesforce ${group} search --sosl "FIND {Acme}"`,
      `salesforce ${group} search --where "CreatedDate = TODAY" --limit 50`,
    ],

    inputSchema: z.object({
      where: z.string().optional().describe('SOQL WHERE clause'),
      sosl: z.string().optional().describe('SOSL search expression (e.g., FIND {term})'),
      fields: z.string().optional().describe('Comma-separated fields to return'),
      limit: z.coerce.number().min(1).max(2000).default(100).describe('Max results'),
      orderBy: z.string().optional().describe('ORDER BY clause'),
    }),

    cliMappings: {
      options: [
        { field: 'where', flags: '-w, --where <clause>', description: 'SOQL WHERE clause' },
        { field: 'sosl', flags: '-s, --sosl <expr>', description: 'SOSL search expression' },
        { field: 'fields', flags: '-f, --fields <fields>', description: 'Fields to return' },
        { field: 'limit', flags: '-l, --limit <number>', description: 'Max results' },
        { field: 'orderBy', flags: '--order-by <clause>', description: 'ORDER BY clause' },
      ],
    },

    endpoint: { method: 'GET', path: '/query' },
    fieldMappings: {},

    handler: async (input, client) => {
      // SOSL search path
      if (input.sosl) {
        const soslQuery = input.sosl.startsWith('FIND')
          ? input.sosl
          : `FIND {${input.sosl}} IN ALL FIELDS RETURNING ${objectType}(${defaultFields.join(', ')} LIMIT ${input.limit})`;
        return client.get('/search', { q: soslQuery });
      }

      // SOQL search path
      const selectedFields = input.fields
        ? input.fields.split(',').map((f: string) => f.trim()).join(', ')
        : defaultFields.join(', ');

      let soql = `SELECT ${selectedFields} FROM ${objectType}`;
      if (input.where) soql += ` WHERE ${input.where}`;
      if (input.orderBy) soql += ` ORDER BY ${input.orderBy}`;
      soql += ` LIMIT ${input.limit}`;

      return client.get<SalesforceQueryResponse>('/query', { q: soql });
    },
  };

  // ── DESCRIBE ─────────────────────────────────────────────
  const describeCommand: CommandDefinition = {
    name: `${group}_describe`,
    group,
    subcommand: 'describe',
    description: `Describe the ${objectType} object schema — fields, relationships, picklist values.`,
    examples: [`salesforce ${group} describe`],

    inputSchema: z.object({}),
    cliMappings: {},
    endpoint: { method: 'GET', path: `/sobjects/${objectType}/describe` },
    fieldMappings: {},

    handler: (_input, client) => {
      return client.get(`/sobjects/${objectType}/describe`);
    },
  };

  return [listCommand, getCommand, createCommand, updateCommand, deleteCommand, searchCommand, describeCommand];
}
