import { createSObjectCommands } from '../../factories/sobject.js';

export const allOpportunitiesCommands = createSObjectCommands({
  objectType: 'Opportunity',
  group: 'opportunities',
  singular: 'opportunity',
  defaultFields: [
    'Id', 'Name', 'StageName', 'Amount', 'CloseDate', 'Probability',
    'AccountId', 'Type', 'LeadSource', 'ForecastCategoryName',
    'IsClosed', 'IsWon', 'OwnerId', 'CreatedDate', 'LastModifiedDate',
  ],
  writeProperties: [
    { field: 'Name', flags: '-n, --name <name>', description: 'Opportunity name', required: true },
    { field: 'StageName', flags: '--stage <stage>', description: 'Stage name (e.g., Prospecting, Closed Won)', required: true },
    { field: 'CloseDate', flags: '--close-date <date>', description: 'Close date (YYYY-MM-DD)', required: true },
    { field: 'Amount', flags: '--amount <amount>', description: 'Deal amount' },
    { field: 'Probability', flags: '--probability <pct>', description: 'Win probability (0-100)' },
    { field: 'AccountId', flags: '--account-id <id>', description: 'Associated account ID' },
    { field: 'Type', flags: '--type <type>', description: 'Type (e.g., New Customer, Existing Customer)' },
    { field: 'LeadSource', flags: '--lead-source <source>', description: 'Lead source' },
    { field: 'NextStep', flags: '--next-step <step>', description: 'Next step description' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'CampaignId', flags: '--campaign-id <id>', description: 'Primary campaign ID' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
  ],
});
