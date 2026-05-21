import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

const reportsListCommand: CommandDefinition = {
  name: 'reports_list',
  group: 'reports',
  subcommand: 'list',
  description: 'List all reports accessible to the current user.',
  examples: ['salesforce reports list'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/analytics/reports' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.get('/analytics/reports');
  },
};

const reportsGetCommand: CommandDefinition = {
  name: 'reports_get',
  group: 'reports',
  subcommand: 'get',
  description: 'Get report metadata (columns, filters, groupings).',
  examples: ['salesforce reports get <reportId>'],

  inputSchema: z.object({
    reportId: z.string().describe('Report ID'),
  }),

  cliMappings: {
    args: [{ field: 'reportId', name: 'reportId', required: true }],
  },

  endpoint: { method: 'GET', path: '/analytics/reports/{reportId}/describe' },
  fieldMappings: { reportId: 'path' },

  handler: async (input, client) => {
    return client.get(`/analytics/reports/${encodeURIComponent(input.reportId)}/describe`);
  },
};

const reportsRunCommand: CommandDefinition = {
  name: 'reports_run',
  group: 'reports',
  subcommand: 'run',
  description: 'Execute a report synchronously and return results.',
  examples: [
    'salesforce reports run <reportId>',
    'salesforce reports run <reportId> --filters \'[{"column":"ACCOUNT_NAME","operator":"contains","value":"Acme"}]\'',
  ],

  inputSchema: z.object({
    reportId: z.string().describe('Report ID'),
    filters: z.string().optional().describe('JSON array of runtime report filters'),
  }),

  cliMappings: {
    args: [{ field: 'reportId', name: 'reportId', required: true }],
    options: [
      { field: 'filters', flags: '-f, --filters <json>', description: 'JSON report filters' },
    ],
  },

  endpoint: { method: 'POST', path: '/analytics/reports/{reportId}' },
  fieldMappings: { reportId: 'path' },

  handler: async (input, client) => {
    const path = `/analytics/reports/${encodeURIComponent(input.reportId)}`;

    if (!input.filters) {
      // GET runs the report with saved metadata; POST requires reportMetadata in the body.
      return client.get(path);
    }

    return client.post(path, {
      reportMetadata: {
        reportFilters: JSON.parse(input.filters),
      },
    });
  },
};

const dashboardsListCommand: CommandDefinition = {
  name: 'reports_dashboards_list',
  group: 'reports',
  subcommand: 'dashboards-list',
  description: 'List all dashboards accessible to the current user.',
  examples: ['salesforce reports dashboards-list'],

  inputSchema: z.object({}),
  cliMappings: {},
  endpoint: { method: 'GET', path: '/analytics/dashboards' },
  fieldMappings: {},

  handler: async (_input, client) => {
    return client.get('/analytics/dashboards');
  },
};

const dashboardsGetCommand: CommandDefinition = {
  name: 'reports_dashboards_get',
  group: 'reports',
  subcommand: 'dashboards-get',
  description: 'Get dashboard metadata and component details.',
  examples: ['salesforce reports dashboards-get <dashboardId>'],

  inputSchema: z.object({
    dashboardId: z.string().describe('Dashboard ID'),
  }),

  cliMappings: {
    args: [{ field: 'dashboardId', name: 'dashboardId', required: true }],
  },

  endpoint: { method: 'GET', path: '/analytics/dashboards/{dashboardId}' },
  fieldMappings: { dashboardId: 'path' },

  handler: async (input, client) => {
    return client.get(`/analytics/dashboards/${encodeURIComponent(input.dashboardId)}`);
  },
};

export const allReportsCommands: CommandDefinition[] = [
  reportsListCommand,
  reportsGetCommand,
  reportsRunCommand,
  dashboardsListCommand,
  dashboardsGetCommand,
];
