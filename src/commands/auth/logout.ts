import { Command } from 'commander';
import { deleteConfig, getConfigPath } from '../../core/config.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored Salesforce credentials')
    .action(async () => {
      await deleteConfig();
      console.log(`Logged out. Removed credentials from ${getConfigPath()}`);
    });
}
