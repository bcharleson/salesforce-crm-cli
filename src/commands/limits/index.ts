import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const limitsGetCommand: CommandDefinition = {
  name: 'limits_get',
  group: 'limits',
  subcommand: 'get',
  description: 'Get current API usage limits for the org — daily API calls, storage, data API, bulk API, streaming, etc.',
  examples: ['salesforce limits get'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/limits' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.get('/limits');
  },
};

const limitsVersionsCommand: CommandDefinition = {
  name: 'limits_versions',
  group: 'limits',
  subcommand: 'versions',
  description: 'List all available Salesforce REST API versions.',
  examples: ['salesforce limits versions'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.request({ method: 'GET', path: '/services/data/', rawPath: true });
  },
};

const limitsResourcesCommand: CommandDefinition = {
  name: 'limits_resources',
  group: 'limits',
  subcommand: 'resources',
  description: 'List all available REST API resources for the current API version.',
  examples: ['salesforce limits resources'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.get('/');
  },
};

export const allLimitsCommands: CommandDefinition[] = [
  limitsGetCommand,
  limitsVersionsCommand,
  limitsResourcesCommand,
];
