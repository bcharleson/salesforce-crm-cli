import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const compositeRunCommand: CommandDefinition = {
  name: 'composite_run',
  group: 'composite',
  subcommand: 'run',
  description: 'Execute multiple API requests in a single call using the Composite API. Supports references between requests.',
  examples: [
    `salesforce composite run --requests '[{"method":"POST","url":"/services/data/v62.0/sobjects/Account","referenceId":"newAccount","body":{"Name":"Acme"}},{"method":"POST","url":"/services/data/v62.0/sobjects/Contact","referenceId":"newContact","body":{"LastName":"Smith","AccountId":"@{newAccount.id}"}}]'`,
  ],

  inputSchema: z.object({
    requests: z.string().describe('JSON array of composite subrequests (max 25)'),
    allOrNone: z.string().optional().describe('Roll back all if any fails (true/false)'),
  }),

  cliMappings: {
    options: [
      { field: 'requests', flags: '-r, --requests <json>', description: 'JSON array of subrequests' },
      { field: 'allOrNone', flags: '--all-or-none', description: 'Roll back all if any fails' },
    ],
  },

  endpoint: { method: 'POST', path: '/composite' },
  fieldMappings: {},

  handler: async (input, client) => {
    const compositeRequest = JSON.parse(input.requests);
    const body: Record<string, any> = {
      compositeRequest: Array.isArray(compositeRequest) ? compositeRequest : [compositeRequest],
    };
    if (input.allOrNone === 'true') body.allOrNone = true;
    return client.post('/composite', body);
  },
};

const compositeBatchCommand: CommandDefinition = {
  name: 'composite_batch',
  group: 'composite',
  subcommand: 'batch',
  description: 'Execute up to 25 independent subrequests in a single API call (no references between requests).',
  examples: [
    `salesforce composite batch --requests '[{"method":"GET","url":"/services/data/v62.0/sobjects/Account/001xx000003GYQIAA4"},{"method":"GET","url":"/services/data/v62.0/sobjects/Contact/003xx000004GHQIAA4"}]'`,
  ],

  inputSchema: z.object({
    requests: z.string().describe('JSON array of batch subrequests'),
    haltOnError: z.string().optional().describe('Stop processing on first error (true/false)'),
  }),

  cliMappings: {
    options: [
      { field: 'requests', flags: '-r, --requests <json>', description: 'JSON array of subrequests' },
      { field: 'haltOnError', flags: '--halt-on-error', description: 'Stop on first error' },
    ],
  },

  endpoint: { method: 'POST', path: '/composite/batch' },
  fieldMappings: {},

  handler: async (input, client) => {
    const batchRequests = JSON.parse(input.requests);
    const body: Record<string, any> = {
      batchRequests: Array.isArray(batchRequests) ? batchRequests : [batchRequests],
    };
    if (input.haltOnError === 'true') body.haltOnError = true;
    return client.post('/composite/batch', body);
  },
};

const compositeTreeCommand: CommandDefinition = {
  name: 'composite_tree',
  group: 'composite',
  subcommand: 'tree',
  description: 'Create a record tree (parent + children) in a single request using the SObject Tree API.',
  examples: [
    `salesforce composite tree --sobject Account --records '[{"attributes":{"type":"Account","referenceId":"ref1"},"Name":"Acme","Contacts":{"records":[{"attributes":{"type":"Contact","referenceId":"ref2"},"LastName":"Smith"}]}}]'`,
  ],

  inputSchema: z.object({
    sobject: z.string().describe('Root SObject type (e.g., Account)'),
    records: z.string().describe('JSON array of record trees'),
  }),

  cliMappings: {
    options: [
      { field: 'sobject', flags: '-s, --sobject <type>', description: 'Root SObject type' },
      { field: 'records', flags: '-r, --records <json>', description: 'JSON array of record trees' },
    ],
  },

  endpoint: { method: 'POST', path: '/composite/tree/{sobject}' },
  fieldMappings: { sobject: 'path' },

  handler: async (input, client) => {
    const records = JSON.parse(input.records);
    return client.post(`/composite/tree/${encodeURIComponent(input.sobject)}`, {
      records: Array.isArray(records) ? records : [records],
    });
  },
};

const compositeCollectionCommand: CommandDefinition = {
  name: 'composite_collection',
  group: 'composite',
  subcommand: 'collection',
  description: 'Create, update, or delete up to 200 records in a single SObject Collections request.',
  examples: [
    `salesforce composite collection --method create --records '[{"attributes":{"type":"Account"},"Name":"Acme"},{"attributes":{"type":"Account"},"Name":"Globex"}]'`,
    `salesforce composite collection --method delete --ids "001xx000003GYQIAA4,001xx000003GYQJAA4"`,
  ],

  inputSchema: z.object({
    method: z.enum(['create', 'update', 'delete']).describe('Operation: create, update, or delete'),
    records: z.string().optional().describe('JSON array of records (for create/update)'),
    ids: z.string().optional().describe('Comma-separated IDs (for delete)'),
    allOrNone: z.string().optional().describe('Roll back all if any fails (true/false)'),
  }),

  cliMappings: {
    options: [
      { field: 'method', flags: '-m, --method <method>', description: 'Operation (create, update, delete)' },
      { field: 'records', flags: '-r, --records <json>', description: 'JSON array of records' },
      { field: 'ids', flags: '--ids <ids>', description: 'Comma-separated IDs for delete' },
      { field: 'allOrNone', flags: '--all-or-none', description: 'Roll back all if any fails' },
    ],
  },

  endpoint: { method: 'POST', path: '/composite/sobjects' },
  fieldMappings: {},

  handler: async (input, client) => {
    if (input.method === 'delete') {
      if (!input.ids) throw new Error('--ids required for delete operation');
      return client.delete('/composite/sobjects', { ids: input.ids, allOrNone: input.allOrNone === 'true' });
    }

    if (!input.records) throw new Error('--records required for create/update operation');
    const records = JSON.parse(input.records);
    const body: Record<string, any> = {
      records: Array.isArray(records) ? records : [records],
    };
    if (input.allOrNone === 'true') body.allOrNone = true;

    if (input.method === 'create') {
      return client.post('/composite/sobjects', body);
    }
    return client.patch('/composite/sobjects', body);
  },
};

export const allCompositeCommands: CommandDefinition[] = [
  compositeRunCommand,
  compositeBatchCommand,
  compositeTreeCommand,
  compositeCollectionCommand,
];
