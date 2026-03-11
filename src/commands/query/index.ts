import { z } from 'zod';
import type { CommandDefinition, SalesforceQueryResponse } from '../../core/types.js';

const queryRunCommand: CommandDefinition = {
  name: 'query_run',
  group: 'query',
  subcommand: 'run',
  description: 'Execute a SOQL query and return results.',
  examples: [
    'salesforce query run --soql "SELECT Id, Name FROM Account LIMIT 10"',
    'salesforce query run --soql "SELECT Id, Email FROM Contact WHERE AccountId = \'001xx000003GYQIAA4\'"',
    'salesforce query run --soql "SELECT COUNT() FROM Lead WHERE Status = \'Open\'" --tooling',
  ],

  inputSchema: z.object({
    soql: z.string().describe('SOQL query string'),
    tooling: z.string().optional().describe('Use Tooling API (true/false)'),
    all: z.string().optional().describe('Include deleted/archived records (queryAll)'),
  }),

  cliMappings: {
    options: [
      { field: 'soql', flags: '-q, --soql <query>', description: 'SOQL query string' },
      { field: 'tooling', flags: '--tooling', description: 'Use Tooling API instead of standard' },
      { field: 'all', flags: '--all', description: 'Include deleted/archived records (queryAll)' },
    ],
  },

  endpoint: { method: 'GET', path: '/query' },
  fieldMappings: {},

  handler: async (input, client) => {
    const basePath = input.tooling ? '/tooling/query' : input.all ? '/queryAll' : '/query';
    return client.get<SalesforceQueryResponse>(basePath, { q: input.soql });
  },
};

const queryExplainCommand: CommandDefinition = {
  name: 'query_explain',
  group: 'query',
  subcommand: 'explain',
  description: 'Get the query execution plan for a SOQL query (useful for performance tuning).',
  examples: [
    'salesforce query explain --soql "SELECT Id, Name FROM Account WHERE Industry = \'Technology\'"',
  ],

  inputSchema: z.object({
    soql: z.string().describe('SOQL query string'),
  }),

  cliMappings: {
    options: [
      { field: 'soql', flags: '-q, --soql <query>', description: 'SOQL query string' },
    ],
  },

  endpoint: { method: 'GET', path: '/query' },
  fieldMappings: {},

  handler: async (input, client) => {
    return client.get('/query', { explain: input.soql });
  },
};

const queryMoreCommand: CommandDefinition = {
  name: 'query_more',
  group: 'query',
  subcommand: 'more',
  description: 'Fetch the next batch of results from a paginated SOQL query using nextRecordsUrl.',
  examples: [
    'salesforce query more --url "/services/data/v62.0/query/01gxx00000000AAAA-2000"',
  ],

  inputSchema: z.object({
    url: z.string().describe('The nextRecordsUrl from a previous query response'),
  }),

  cliMappings: {
    options: [
      { field: 'url', flags: '-u, --url <nextRecordsUrl>', description: 'nextRecordsUrl from previous query' },
    ],
  },

  endpoint: { method: 'GET', path: '/' },
  fieldMappings: {},

  handler: async (input, client) => {
    return client.request<SalesforceQueryResponse>({
      method: 'GET',
      path: input.url,
      rawPath: true,
    });
  },
};

export const allQueryCommands: CommandDefinition[] = [
  queryRunCommand,
  queryExplainCommand,
  queryMoreCommand,
];
