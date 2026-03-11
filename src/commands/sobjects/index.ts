import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const sobjectsListCommand: CommandDefinition = {
  name: 'sobjects_list',
  group: 'sobjects',
  subcommand: 'list',
  description: 'List all SObject types available in the org.',
  examples: ['salesforce sobjects list'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/sobjects' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.get('/sobjects');
  },
};

const sobjectsDescribeCommand: CommandDefinition = {
  name: 'sobjects_describe',
  group: 'sobjects',
  subcommand: 'describe',
  description: 'Get full metadata description of an SObject — fields, relationships, picklist values, record types.',
  examples: [
    'salesforce sobjects describe Account',
    'salesforce sobjects describe CustomObject__c',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name (e.g., Account, Contact, Lead, CustomObject__c)'),
  }),

  cliMappings: {
    args: [{ field: 'sobject', name: 'sobject', required: true }],
  },

  endpoint: { method: 'GET', path: '/sobjects/{sobject}/describe' },
  fieldMappings: { sobject: 'path' },

  handler: async (input, client) => {
    return client.get(`/sobjects/${encodeURIComponent(input.sobject)}/describe`);
  },
};

const sobjectsMetadataCommand: CommandDefinition = {
  name: 'sobjects_metadata',
  group: 'sobjects',
  subcommand: 'metadata',
  description: 'Get basic metadata for an SObject (lighter than describe).',
  examples: ['salesforce sobjects metadata Account'],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
  }),

  cliMappings: {
    args: [{ field: 'sobject', name: 'sobject', required: true }],
  },

  endpoint: { method: 'GET', path: '/sobjects/{sobject}' },
  fieldMappings: { sobject: 'path' },

  handler: async (input, client) => {
    return client.get(`/sobjects/${encodeURIComponent(input.sobject)}`);
  },
};

const sobjectsGetCommand: CommandDefinition = {
  name: 'sobjects_get',
  group: 'sobjects',
  subcommand: 'get',
  description: 'Get a record from any SObject by type and ID.',
  examples: [
    'salesforce sobjects get Account 001xx000003GYQIAA4',
    'salesforce sobjects get CustomObject__c a00xx0000000001AAA --fields "Id,Name,Custom_Field__c"',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
    id: z.string().describe('Record ID'),
    fields: z.string().optional().describe('Comma-separated fields to return'),
  }),

  cliMappings: {
    args: [
      { field: 'sobject', name: 'sobject', required: true },
      { field: 'id', name: 'id', required: true },
    ],
    options: [
      { field: 'fields', flags: '-f, --fields <fields>', description: 'Fields to return' },
    ],
  },

  endpoint: { method: 'GET', path: '/sobjects/{sobject}/{id}' },
  fieldMappings: { sobject: 'path', id: 'path' },

  handler: async (input, client) => {
    const query: Record<string, string> = {};
    if (input.fields) query.fields = input.fields;
    return client.get(`/sobjects/${encodeURIComponent(input.sobject)}/${encodeURIComponent(input.id)}`, query);
  },
};

const sobjectsCreateCommand: CommandDefinition = {
  name: 'sobjects_create',
  group: 'sobjects',
  subcommand: 'create',
  description: 'Create a record for any SObject type using JSON data.',
  examples: [
    'salesforce sobjects create Account --data \'{"Name":"Acme Corp","Industry":"Technology"}\'',
    'salesforce sobjects create CustomObject__c --data \'{"Name":"Test","Custom_Field__c":"value"}\'',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
    data: z.string().describe('JSON object with field values'),
  }),

  cliMappings: {
    args: [{ field: 'sobject', name: 'sobject', required: true }],
    options: [
      { field: 'data', flags: '-d, --data <json>', description: 'JSON field values' },
    ],
  },

  endpoint: { method: 'POST', path: '/sobjects/{sobject}' },
  fieldMappings: { sobject: 'path' },

  handler: async (input, client) => {
    const body = JSON.parse(input.data);
    return client.post(`/sobjects/${encodeURIComponent(input.sobject)}`, body);
  },
};

const sobjectsUpdateCommand: CommandDefinition = {
  name: 'sobjects_update',
  group: 'sobjects',
  subcommand: 'update',
  description: 'Update a record for any SObject type using JSON data.',
  examples: [
    'salesforce sobjects update Account 001xx000003GYQIAA4 --data \'{"Industry":"Finance"}\'',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
    id: z.string().describe('Record ID'),
    data: z.string().describe('JSON object with fields to update'),
  }),

  cliMappings: {
    args: [
      { field: 'sobject', name: 'sobject', required: true },
      { field: 'id', name: 'id', required: true },
    ],
    options: [
      { field: 'data', flags: '-d, --data <json>', description: 'JSON field values to update' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/sobjects/{sobject}/{id}' },
  fieldMappings: { sobject: 'path', id: 'path' },

  handler: async (input, client) => {
    const body = JSON.parse(input.data);
    await client.patch(`/sobjects/${encodeURIComponent(input.sobject)}/${encodeURIComponent(input.id)}`, body);
    return { status: 'updated', id: input.id };
  },
};

const sobjectsDeleteCommand: CommandDefinition = {
  name: 'sobjects_delete',
  group: 'sobjects',
  subcommand: 'delete',
  description: 'Delete a record from any SObject type.',
  examples: ['salesforce sobjects delete Account 001xx000003GYQIAA4'],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
    id: z.string().describe('Record ID'),
  }),

  cliMappings: {
    args: [
      { field: 'sobject', name: 'sobject', required: true },
      { field: 'id', name: 'id', required: true },
    ],
  },

  endpoint: { method: 'DELETE', path: '/sobjects/{sobject}/{id}' },
  fieldMappings: { sobject: 'path', id: 'path' },

  handler: async (input, client) => {
    await client.delete(`/sobjects/${encodeURIComponent(input.sobject)}/${encodeURIComponent(input.id)}`);
    return { status: 'deleted', id: input.id };
  },
};

const sobjectsUpsertCommand: CommandDefinition = {
  name: 'sobjects_upsert',
  group: 'sobjects',
  subcommand: 'upsert',
  description: 'Upsert (insert or update) a record using an external ID field.',
  examples: [
    'salesforce sobjects upsert Account --external-field External_Id__c --external-value EXT-001 --data \'{"Name":"Acme","Industry":"Tech"}\'',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name'),
    externalField: z.string().describe('External ID field API name'),
    externalValue: z.string().describe('External ID value'),
    data: z.string().describe('JSON object with field values'),
  }),

  cliMappings: {
    args: [{ field: 'sobject', name: 'sobject', required: true }],
    options: [
      { field: 'externalField', flags: '--external-field <field>', description: 'External ID field name' },
      { field: 'externalValue', flags: '--external-value <value>', description: 'External ID value' },
      { field: 'data', flags: '-d, --data <json>', description: 'JSON field values' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/sobjects/{sobject}/{externalField}/{externalValue}' },
  fieldMappings: { sobject: 'path', externalField: 'path', externalValue: 'path' },

  handler: async (input, client) => {
    const body = JSON.parse(input.data);
    return client.patch(
      `/sobjects/${encodeURIComponent(input.sobject)}/${encodeURIComponent(input.externalField)}/${encodeURIComponent(input.externalValue)}`,
      body,
    );
  },
};

export const allSObjectsCommands: CommandDefinition[] = [
  sobjectsListCommand,
  sobjectsDescribeCommand,
  sobjectsMetadataCommand,
  sobjectsGetCommand,
  sobjectsCreateCommand,
  sobjectsUpdateCommand,
  sobjectsDeleteCommand,
  sobjectsUpsertCommand,
];
