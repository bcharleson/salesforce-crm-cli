import { createSObjectCommands } from '../../factories/sobject.js';

export const allCasesCommands = createSObjectCommands({
  objectType: 'Case',
  group: 'cases',
  singular: 'case',
  defaultFields: [
    'Id', 'CaseNumber', 'Subject', 'Status', 'Priority', 'Origin',
    'Type', 'ContactId', 'AccountId', 'OwnerId',
    'IsClosed', 'IsEscalated', 'CreatedDate', 'ClosedDate',
  ],
  writeProperties: [
    { field: 'Subject', flags: '--subject <subject>', description: 'Case subject' },
    { field: 'Status', flags: '--status <status>', description: 'Status (e.g., New, Working, Escalated, Closed)' },
    { field: 'Priority', flags: '--priority <priority>', description: 'Priority (High, Medium, Low)' },
    { field: 'Origin', flags: '--origin <origin>', description: 'Case origin (e.g., Email, Phone, Web)' },
    { field: 'Type', flags: '--type <type>', description: 'Case type' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'ContactId', flags: '--contact-id <id>', description: 'Contact ID' },
    { field: 'AccountId', flags: '--account-id <id>', description: 'Account ID' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
    { field: 'Reason', flags: '--reason <reason>', description: 'Case reason' },
  ],
});
