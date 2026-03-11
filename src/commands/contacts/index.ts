import { createSObjectCommands } from '../../factories/sobject.js';

export const allContactsCommands = createSObjectCommands({
  objectType: 'Contact',
  group: 'contacts',
  singular: 'contact',
  defaultFields: [
    'Id', 'FirstName', 'LastName', 'Email', 'Phone', 'Title',
    'AccountId', 'MailingCity', 'MailingState', 'Department',
    'OwnerId', 'CreatedDate', 'LastModifiedDate',
  ],
  writeProperties: [
    { field: 'LastName', flags: '--last-name <name>', description: 'Last name', required: true },
    { field: 'FirstName', flags: '--first-name <name>', description: 'First name' },
    { field: 'Email', flags: '-e, --email <email>', description: 'Email address' },
    { field: 'Phone', flags: '--phone <phone>', description: 'Phone number' },
    { field: 'MobilePhone', flags: '--mobile <phone>', description: 'Mobile phone' },
    { field: 'Title', flags: '--title <title>', description: 'Job title' },
    { field: 'Department', flags: '--department <dept>', description: 'Department' },
    { field: 'AccountId', flags: '--account-id <id>', description: 'Associated account ID' },
    { field: 'MailingStreet', flags: '--mailing-street <street>', description: 'Mailing street' },
    { field: 'MailingCity', flags: '--mailing-city <city>', description: 'Mailing city' },
    { field: 'MailingState', flags: '--mailing-state <state>', description: 'Mailing state' },
    { field: 'MailingPostalCode', flags: '--mailing-zip <zip>', description: 'Mailing postal code' },
    { field: 'MailingCountry', flags: '--mailing-country <country>', description: 'Mailing country' },
    { field: 'LeadSource', flags: '--lead-source <source>', description: 'Lead source' },
    { field: 'Description', flags: '--description <text>', description: 'Description' },
    { field: 'OwnerId', flags: '--owner-id <id>', description: 'Owner user ID' },
  ],
});
