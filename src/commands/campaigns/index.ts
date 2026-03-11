import { createSObjectCommands } from '../../factories/sobject.js';

export const allCampaignsCommands = createSObjectCommands({
  objectType: 'Campaign',
  group: 'campaigns',
  singular: 'campaign',
  defaultFields: [
    'Id', 'Name', 'Type', 'Status', 'StartDate', 'EndDate',
    'IsActive', 'BudgetedCost', 'ActualCost', 'ExpectedRevenue',
    'NumberOfLeads', 'NumberOfContacts', 'NumberOfResponses',
    'NumberOfConvertedLeads', 'NumberOfOpportunities',
    'OwnerId', 'CreatedDate',
  ],
  writeProperties: [
    { field: 'Name', flags: '-n, --name <name>', description: 'Campaign name', required: true },
    { field: 'Type', flags: '--type <type>', description: 'Campaign type (e.g., Email, Webinar, Conference)' },
    { field: 'Status', flags: '--status <status>', description: 'Status (e.g., Planned, In Progress, Completed, Aborted)' },
    { field: 'StartDate', flags: '--start-date <date>', description: 'Start date (YYYY-MM-DD)' },
    { field: 'EndDate', flags: '--end-date <date>', description: 'End date (YYYY-MM-DD)' },
    { field: 'IsActive', flags: '--active <bool>', description: 'Active (true/false)' },
    { field: 'BudgetedCost', flags: '--budget <amount>', description: 'Budgeted cost' },
    { field: 'ActualCost', flags: '--actual-cost <amount>', description: 'Actual cost' },
    { field: 'ExpectedRevenue', flags: '--expected-revenue <amount>', description: 'Expected revenue' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'ParentId', flags: '--parent-id <id>', description: 'Parent campaign ID' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
  ],
});
