import { createSObjectCommands } from '../../factories/sobject.js';

export const allAccountsCommands = createSObjectCommands({
  objectType: 'Account',
  group: 'accounts',
  singular: 'account',
  defaultFields: [
    'Id', 'Name', 'Type', 'Industry', 'Phone', 'Website',
    'BillingCity', 'BillingState', 'AnnualRevenue', 'NumberOfEmployees',
    'OwnerId', 'CreatedDate', 'LastModifiedDate',
  ],
  writeProperties: [
    { field: 'Name', flags: '-n, --name <name>', description: 'Account name', required: true },
    { field: 'Type', flags: '--type <type>', description: 'Account type (e.g., Customer, Partner, Prospect)' },
    { field: 'Industry', flags: '--industry <industry>', description: 'Industry' },
    { field: 'Phone', flags: '--phone <phone>', description: 'Phone number' },
    { field: 'Website', flags: '--website <url>', description: 'Website URL' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'BillingStreet', flags: '--billing-street <street>', description: 'Billing street' },
    { field: 'BillingCity', flags: '--billing-city <city>', description: 'Billing city' },
    { field: 'BillingState', flags: '--billing-state <state>', description: 'Billing state' },
    { field: 'BillingPostalCode', flags: '--billing-zip <zip>', description: 'Billing postal code' },
    { field: 'BillingCountry', flags: '--billing-country <country>', description: 'Billing country' },
    { field: 'AnnualRevenue', flags: '--annual-revenue <amount>', description: 'Annual revenue' },
    { field: 'NumberOfEmployees', flags: '--employees <count>', description: 'Number of employees' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
    { field: 'ParentId', flags: '--parent-id <id>', description: 'Parent account ID' },
  ],
});
