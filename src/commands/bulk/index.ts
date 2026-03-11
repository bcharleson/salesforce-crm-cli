import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const bulkIngestCreateCommand: CommandDefinition = {
  name: 'bulk_ingest_create',
  group: 'bulk',
  subcommand: 'ingest-create',
  description: 'Create a Bulk API 2.0 ingest job (insert, update, upsert, or delete).',
  examples: [
    'salesforce bulk ingest-create --sobject Account --operation insert',
    'salesforce bulk ingest-create --sobject Contact --operation upsert --external-id Email',
  ],

  inputSchema: z.object({
    sobject: z.string().describe('SObject API name (e.g., Account, Contact)'),
    operation: z.enum(['insert', 'update', 'upsert', 'delete', 'hardDelete']).describe('Operation type'),
    externalIdFieldName: z.string().optional().describe('External ID field (required for upsert)'),
    lineEnding: z.enum(['LF', 'CRLF']).optional().describe('Line ending for CSV (default: LF)'),
    columnDelimiter: z.enum(['BACKQUOTE', 'CARET', 'COMMA', 'PIPE', 'SEMICOLON', 'TAB']).optional().describe('Column delimiter (default: COMMA)'),
  }),

  cliMappings: {
    options: [
      { field: 'sobject', flags: '-s, --sobject <type>', description: 'SObject API name' },
      { field: 'operation', flags: '-o, --operation <op>', description: 'Operation (insert, update, upsert, delete, hardDelete)' },
      { field: 'externalIdFieldName', flags: '--external-id <field>', description: 'External ID field for upsert' },
      { field: 'lineEnding', flags: '--line-ending <ending>', description: 'Line ending (LF or CRLF)' },
      { field: 'columnDelimiter', flags: '--delimiter <delim>', description: 'Column delimiter' },
    ],
  },

  endpoint: { method: 'POST', path: '/jobs/ingest' },
  fieldMappings: {},

  handler: async (input, client) => {
    const body: Record<string, any> = {
      object: input.sobject,
      operation: input.operation,
      contentType: 'CSV',
    };
    if (input.externalIdFieldName) body.externalIdFieldName = input.externalIdFieldName;
    if (input.lineEnding) body.lineEnding = input.lineEnding;
    if (input.columnDelimiter) body.columnDelimiter = input.columnDelimiter;

    return client.post('/jobs/ingest', body);
  },
};

const bulkIngestUploadCommand: CommandDefinition = {
  name: 'bulk_ingest_upload',
  group: 'bulk',
  subcommand: 'ingest-upload',
  description: 'Upload CSV data to an existing Bulk API 2.0 ingest job.',
  examples: [
    'salesforce bulk ingest-upload --job-id 750xx000000000AAAA --csv "Name,Industry\\nAcme,Technology"',
  ],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk job ID'),
    csv: z.string().describe('CSV data string (header row + data rows)'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk job ID' },
      { field: 'csv', flags: '--csv <data>', description: 'CSV data (header + rows)' },
    ],
  },

  endpoint: { method: 'PUT', path: '/jobs/ingest/{jobId}/batches' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    // Bulk upload needs raw CSV, not JSON — use custom request
    const path = `/services/data/v62.0/jobs/ingest/${encodeURIComponent(input.jobId)}/batches`;
    const response = await fetch(`${(client as any).instanceUrl ?? ''}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${(client as any).accessToken ?? ''}`,
        'Content-Type': 'text/csv',
      },
      body: input.csv,
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }
    return { status: 'uploaded', jobId: input.jobId };
  },
};

const bulkIngestCloseCommand: CommandDefinition = {
  name: 'bulk_ingest_close',
  group: 'bulk',
  subcommand: 'ingest-close',
  description: 'Close a Bulk API 2.0 ingest job to begin processing.',
  examples: ['salesforce bulk ingest-close --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk job ID'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk job ID' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/jobs/ingest/{jobId}' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    return client.patch(`/jobs/ingest/${encodeURIComponent(input.jobId)}`, {
      state: 'UploadComplete',
    });
  },
};

const bulkIngestStatusCommand: CommandDefinition = {
  name: 'bulk_ingest_status',
  group: 'bulk',
  subcommand: 'ingest-status',
  description: 'Check the status of a Bulk API 2.0 ingest job.',
  examples: ['salesforce bulk ingest-status --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk job ID'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk job ID' },
    ],
  },

  endpoint: { method: 'GET', path: '/jobs/ingest/{jobId}' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    return client.get(`/jobs/ingest/${encodeURIComponent(input.jobId)}`);
  },
};

const bulkIngestResultsCommand: CommandDefinition = {
  name: 'bulk_ingest_results',
  group: 'bulk',
  subcommand: 'ingest-results',
  description: 'Get successful results from a completed Bulk API 2.0 ingest job.',
  examples: ['salesforce bulk ingest-results --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk job ID'),
    type: z.enum(['successful', 'failed', 'unprocessed']).default('successful').describe('Result type'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk job ID' },
      { field: 'type', flags: '--type <type>', description: 'Result type (successful, failed, unprocessed)' },
    ],
  },

  endpoint: { method: 'GET', path: '/jobs/ingest/{jobId}/successfulResults' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    const resultPath = input.type === 'failed'
      ? 'failedResults'
      : input.type === 'unprocessed'
        ? 'unprocessedrecords'
        : 'successfulResults';
    return client.get(`/jobs/ingest/${encodeURIComponent(input.jobId)}/${resultPath}`);
  },
};

const bulkIngestAbortCommand: CommandDefinition = {
  name: 'bulk_ingest_abort',
  group: 'bulk',
  subcommand: 'ingest-abort',
  description: 'Abort a Bulk API 2.0 ingest job.',
  examples: ['salesforce bulk ingest-abort --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk job ID'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk job ID' },
    ],
  },

  endpoint: { method: 'PATCH', path: '/jobs/ingest/{jobId}' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    return client.patch(`/jobs/ingest/${encodeURIComponent(input.jobId)}`, {
      state: 'Aborted',
    });
  },
};

const bulkIngestListCommand: CommandDefinition = {
  name: 'bulk_ingest_list',
  group: 'bulk',
  subcommand: 'ingest-list',
  description: 'List all Bulk API 2.0 ingest jobs.',
  examples: ['salesforce bulk ingest-list'],

  inputSchema: z.object({
    isPkChunkingEnabled: z.string().optional().describe('Filter by PK chunking'),
    jobType: z.enum(['BigObjectIngest', 'Classic', 'V2Ingest']).optional().describe('Job type filter'),
  }),

  cliMappings: {
    options: [
      { field: 'jobType', flags: '--job-type <type>', description: 'Filter by job type' },
    ],
  },

  endpoint: { method: 'GET', path: '/jobs/ingest' },
  fieldMappings: {},

  handler: async (input, client) => {
    const query: Record<string, string> = {};
    if (input.jobType) query.jobType = input.jobType;
    return client.get('/jobs/ingest', query);
  },
};

const bulkQueryCreateCommand: CommandDefinition = {
  name: 'bulk_query_create',
  group: 'bulk',
  subcommand: 'query-create',
  description: 'Create a Bulk API 2.0 query job.',
  examples: [
    'salesforce bulk query-create --soql "SELECT Id, Name FROM Account"',
  ],

  inputSchema: z.object({
    soql: z.string().describe('SOQL query string'),
    columnDelimiter: z.enum(['BACKQUOTE', 'CARET', 'COMMA', 'PIPE', 'SEMICOLON', 'TAB']).optional().describe('Column delimiter'),
    lineEnding: z.enum(['LF', 'CRLF']).optional().describe('Line ending'),
  }),

  cliMappings: {
    options: [
      { field: 'soql', flags: '-q, --soql <query>', description: 'SOQL query' },
      { field: 'columnDelimiter', flags: '--delimiter <delim>', description: 'Column delimiter' },
      { field: 'lineEnding', flags: '--line-ending <ending>', description: 'Line ending' },
    ],
  },

  endpoint: { method: 'POST', path: '/jobs/query' },
  fieldMappings: {},

  handler: async (input, client) => {
    const body: Record<string, any> = {
      operation: 'query',
      query: input.soql,
    };
    if (input.columnDelimiter) body.columnDelimiter = input.columnDelimiter;
    if (input.lineEnding) body.lineEnding = input.lineEnding;
    return client.post('/jobs/query', body);
  },
};

const bulkQueryStatusCommand: CommandDefinition = {
  name: 'bulk_query_status',
  group: 'bulk',
  subcommand: 'query-status',
  description: 'Check the status of a Bulk API 2.0 query job.',
  examples: ['salesforce bulk query-status --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk query job ID'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk query job ID' },
    ],
  },

  endpoint: { method: 'GET', path: '/jobs/query/{jobId}' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    return client.get(`/jobs/query/${encodeURIComponent(input.jobId)}`);
  },
};

const bulkQueryResultsCommand: CommandDefinition = {
  name: 'bulk_query_results',
  group: 'bulk',
  subcommand: 'query-results',
  description: 'Get results from a completed Bulk API 2.0 query job.',
  examples: ['salesforce bulk query-results --job-id 750xx000000000AAAA'],

  inputSchema: z.object({
    jobId: z.string().describe('Bulk query job ID'),
    maxRecords: z.coerce.number().optional().describe('Max records to return'),
  }),

  cliMappings: {
    options: [
      { field: 'jobId', flags: '--job-id <id>', description: 'Bulk query job ID' },
      { field: 'maxRecords', flags: '--max-records <count>', description: 'Max records' },
    ],
  },

  endpoint: { method: 'GET', path: '/jobs/query/{jobId}/results' },
  fieldMappings: { jobId: 'path' },

  handler: async (input, client) => {
    const query: Record<string, any> = {};
    if (input.maxRecords) query.maxRecords = input.maxRecords;
    return client.get(`/jobs/query/${encodeURIComponent(input.jobId)}/results`, query);
  },
};

export const allBulkCommands: CommandDefinition[] = [
  bulkIngestCreateCommand,
  bulkIngestUploadCommand,
  bulkIngestCloseCommand,
  bulkIngestStatusCommand,
  bulkIngestResultsCommand,
  bulkIngestAbortCommand,
  bulkIngestListCommand,
  bulkQueryCreateCommand,
  bulkQueryStatusCommand,
  bulkQueryResultsCommand,
];
