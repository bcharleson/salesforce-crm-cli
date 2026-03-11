import { createSObjectCommands } from '../../factories/sobject.js';

export const allTasksCommands = createSObjectCommands({
  objectType: 'Task',
  group: 'tasks',
  singular: 'task',
  defaultFields: [
    'Id', 'Subject', 'Status', 'Priority', 'ActivityDate',
    'WhoId', 'WhatId', 'OwnerId', 'Description',
    'IsClosed', 'IsHighPriority', 'CreatedDate',
  ],
  writeProperties: [
    { field: 'Subject', flags: '--subject <subject>', description: 'Task subject', required: true },
    { field: 'Status', flags: '--status <status>', description: 'Status (e.g., Not Started, In Progress, Completed)' },
    { field: 'Priority', flags: '--priority <priority>', description: 'Priority (High, Normal, Low)' },
    { field: 'ActivityDate', flags: '--due-date <date>', description: 'Due date (YYYY-MM-DD)' },
    { field: 'WhoId', flags: '--who-id <id>', description: 'Related contact/lead ID' },
    { field: 'WhatId', flags: '--what-id <id>', description: 'Related account/opportunity ID' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
    { field: 'CallType', flags: '--call-type <type>', description: 'Call type (Inbound, Outbound, Internal)' },
    { field: 'CallDurationInSeconds', flags: '--call-duration <seconds>', description: 'Call duration in seconds' },
  ],
});
