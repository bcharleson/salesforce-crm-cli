import { createSObjectCommands } from '../../factories/sobject.js';

export const allEventsCommands = createSObjectCommands({
  objectType: 'Event',
  group: 'events',
  singular: 'event',
  defaultFields: [
    'Id', 'Subject', 'StartDateTime', 'EndDateTime', 'Location',
    'WhoId', 'WhatId', 'OwnerId', 'Description',
    'IsAllDayEvent', 'ShowAs', 'CreatedDate',
  ],
  writeProperties: [
    { field: 'Subject', flags: '--subject <subject>', description: 'Event subject', required: true },
    { field: 'StartDateTime', flags: '--start <datetime>', description: 'Start date/time (ISO 8601)', required: true },
    { field: 'EndDateTime', flags: '--end <datetime>', description: 'End date/time (ISO 8601)', required: true },
    { field: 'Location', flags: '--location <location>', description: 'Location' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'WhoId', flags: '--who-id <id>', description: 'Related contact/lead ID' },
    { field: 'WhatId', flags: '--what-id <id>', description: 'Related account/opportunity ID' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
    { field: 'IsAllDayEvent', flags: '--all-day <bool>', description: 'All day event (true/false)' },
    { field: 'ShowAs', flags: '--show-as <status>', description: 'Show as (Busy, Free, OutOfOffice)' },
  ],
});
