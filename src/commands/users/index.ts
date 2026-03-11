import { createSObjectCommands } from '../../factories/sobject.js';

export const allUsersCommands = createSObjectCommands({
  objectType: 'User',
  group: 'users',
  singular: 'user',
  defaultFields: [
    'Id', 'Username', 'Name', 'FirstName', 'LastName', 'Email',
    'Alias', 'IsActive', 'ProfileId', 'UserRoleId', 'UserType',
    'Title', 'Department', 'CompanyName', 'Phone',
    'CreatedDate', 'LastLoginDate',
  ],
  writeProperties: [
    { field: 'FirstName', flags: '--first-name <name>', description: 'First name' },
    { field: 'LastName', flags: '--last-name <name>', description: 'Last name', required: true },
    { field: 'Email', flags: '-e, --email <email>', description: 'Email address', required: true },
    { field: 'Username', flags: '--username <username>', description: 'Username (must be unique, email format)', required: true },
    { field: 'Alias', flags: '--alias <alias>', description: 'Alias (8 chars max)', required: true },
    { field: 'ProfileId', flags: '--profile-id <id>', description: 'Profile ID', required: true },
    { field: 'TimeZoneSidKey', flags: '--timezone <tz>', description: 'Timezone (e.g., America/Los_Angeles)' },
    { field: 'LocaleSidKey', flags: '--locale <locale>', description: 'Locale (e.g., en_US)' },
    { field: 'EmailEncodingKey', flags: '--email-encoding <enc>', description: 'Email encoding (e.g., UTF-8)' },
    { field: 'LanguageLocaleKey', flags: '--language <lang>', description: 'Language (e.g., en_US)' },
    { field: 'Title', flags: '--title <title>', description: 'Job title' },
    { field: 'Department', flags: '--department <dept>', description: 'Department' },
    { field: 'Phone', flags: '--phone <phone>', description: 'Phone number' },
    { field: 'IsActive', flags: '--active <bool>', description: 'Active (true/false)' },
    { field: 'UserRoleId', flags: '--role-id <id>', description: 'User role ID' },
  ],
});
