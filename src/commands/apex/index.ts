import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const apexExecuteCommand: CommandDefinition = {
  name: 'apex_execute',
  group: 'apex',
  subcommand: 'execute',
  description: 'Execute anonymous Apex code.',
  examples: [
    `salesforce apex execute --code "System.debug('Hello World');"`,
    `salesforce apex execute --code "List<Account> accts = [SELECT Id, Name FROM Account LIMIT 5]; System.debug(accts);"`,
  ],

  inputSchema: z.object({
    code: z.string().describe('Apex code to execute'),
  }),

  cliMappings: {
    options: [
      { field: 'code', flags: '-c, --code <apex>', description: 'Apex code to execute' },
    ],
  },

  endpoint: { method: 'POST', path: '/tooling/executeAnonymous' },
  fieldMappings: {},

  handler: async (input, client) => {
    return client.get('/tooling/executeAnonymous', {
      anonymousBody: input.code,
    });
  },
};

const apexRestCommand: CommandDefinition = {
  name: 'apex_rest',
  group: 'apex',
  subcommand: 'rest',
  description: 'Call a custom Apex REST endpoint.',
  examples: [
    'salesforce apex rest --path /MyCustomEndpoint --method GET',
    'salesforce apex rest --path /MyCustomEndpoint --method POST --body \'{"key":"value"}\'',
  ],

  inputSchema: z.object({
    path: z.string().describe('Apex REST endpoint path (e.g., /MyCustomEndpoint)'),
    method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).default('GET').describe('HTTP method'),
    body: z.string().optional().describe('JSON request body'),
  }),

  cliMappings: {
    options: [
      { field: 'path', flags: '-p, --path <path>', description: 'Apex REST path' },
      { field: 'method', flags: '-m, --method <method>', description: 'HTTP method' },
      { field: 'body', flags: '-b, --body <json>', description: 'Request body JSON' },
    ],
  },

  endpoint: { method: 'GET', path: '/apexrest' },
  fieldMappings: {},

  handler: async (input, client) => {
    const apexPath = input.path.startsWith('/') ? input.path : `/${input.path}`;
    const fullPath = `/services/apexrest${apexPath}`;
    const body = input.body ? JSON.parse(input.body) : undefined;

    return client.request({
      method: input.method as any,
      path: fullPath,
      body,
      rawPath: true,
    });
  },
};

const apexTestRunCommand: CommandDefinition = {
  name: 'apex_test_run',
  group: 'apex',
  subcommand: 'test-run',
  description: 'Run Apex test classes asynchronously.',
  examples: [
    'salesforce apex test-run --class-ids "01pxx000000000AAAA,01pxx000000000BAAA"',
    'salesforce apex test-run --suite-ids "05Fxx000000000AAAA"',
  ],

  inputSchema: z.object({
    classIds: z.string().optional().describe('Comma-separated test class IDs'),
    suiteIds: z.string().optional().describe('Comma-separated test suite IDs'),
    testLevel: z.enum(['RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg']).optional().describe('Test level'),
  }),

  cliMappings: {
    options: [
      { field: 'classIds', flags: '--class-ids <ids>', description: 'Test class IDs' },
      { field: 'suiteIds', flags: '--suite-ids <ids>', description: 'Test suite IDs' },
      { field: 'testLevel', flags: '--test-level <level>', description: 'Test level' },
    ],
  },

  endpoint: { method: 'POST', path: '/tooling/runTestsAsynchronous' },
  fieldMappings: {},

  handler: async (input, client) => {
    const body: Record<string, any> = {};
    if (input.classIds) body.classids = input.classIds;
    if (input.suiteIds) body.suiteids = input.suiteIds;
    if (input.testLevel) body.testLevel = input.testLevel;
    return client.post('/tooling/runTestsAsynchronous', body);
  },
};

const apexTestResultsCommand: CommandDefinition = {
  name: 'apex_test_results',
  group: 'apex',
  subcommand: 'test-results',
  description: 'Get Apex test run results.',
  examples: ['salesforce apex test-results --run-id 707xx000000000AAAA'],

  inputSchema: z.object({
    runId: z.string().describe('Async test run ID'),
  }),

  cliMappings: {
    options: [
      { field: 'runId', flags: '--run-id <id>', description: 'Test run ID' },
    ],
  },

  endpoint: { method: 'GET', path: '/tooling/query' },
  fieldMappings: {},

  handler: async (input, client) => {
    const soql = `SELECT Id, Status, ClassesCompleted, ClassesEnqueued, MethodsCompleted, MethodsFailed, MethodsEnqueued, StartTime, EndTime, TestTime FROM ApexTestRunResult WHERE AsyncApexJobId = '${input.runId}'`;
    return client.get('/tooling/query', { q: soql });
  },
};

export const allApexCommands: CommandDefinition[] = [
  apexExecuteCommand,
  apexRestCommand,
  apexTestRunCommand,
  apexTestResultsCommand,
];
