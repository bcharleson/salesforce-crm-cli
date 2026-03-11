import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const searchRunCommand: CommandDefinition = {
  name: 'search_run',
  group: 'search',
  subcommand: 'run',
  description: 'Execute a SOSL search across multiple objects.',
  examples: [
    'salesforce search run --sosl "FIND {Acme} IN ALL FIELDS RETURNING Account(Id, Name), Contact(Id, Name, Email)"',
    'salesforce search run --sosl "FIND {john@example.com} IN EMAIL FIELDS RETURNING Contact, Lead"',
  ],

  inputSchema: z.object({
    sosl: z.string().describe('SOSL search string'),
  }),

  cliMappings: {
    options: [
      { field: 'sosl', flags: '-q, --sosl <query>', description: 'SOSL search string' },
    ],
  },

  endpoint: { method: 'GET', path: '/search' },
  fieldMappings: {},

  handler: async (input, client) => {
    return client.get('/search', { q: input.sosl });
  },
};

const searchSuggestCommand: CommandDefinition = {
  name: 'search_suggest',
  group: 'search',
  subcommand: 'suggest',
  description: 'Get search suggestions for a given text and SObject type.',
  examples: [
    'salesforce search suggest --text "Acme" --sobject Account',
    'salesforce search suggest --text "john" --sobject Contact',
  ],

  inputSchema: z.object({
    text: z.string().describe('Search text'),
    sobject: z.string().describe('SObject type to search'),
  }),

  cliMappings: {
    options: [
      { field: 'text', flags: '-t, --text <text>', description: 'Search text' },
      { field: 'sobject', flags: '-s, --sobject <type>', description: 'SObject type' },
    ],
  },

  endpoint: { method: 'GET', path: '/search/suggestions' },
  fieldMappings: {},

  handler: async (input, client) => {
    return client.get('/search/suggestions', {
      q: input.text,
      sobject: input.sobject,
    });
  },
};

export const allSearchCommands: CommandDefinition[] = [
  searchRunCommand,
  searchSuggestCommand,
];
