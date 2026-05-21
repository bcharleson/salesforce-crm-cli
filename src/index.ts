import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';
import { VERSION } from './version.js';

const program = new Command();

program
  .name('salesforce')
  .description('CLI and MCP server for the Salesforce REST API')
  .version(VERSION)
  .option('--access-token <token>', 'Access token (overrides SALESFORCE_ACCESS_TOKEN env var and stored config)')
  .option('--instance-url <url>', 'Salesforce instance URL (overrides SALESFORCE_INSTANCE_URL env var and stored config)')
  .option('--api-version <version>', 'API version (default: v62.0)')
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated list of fields to include in output');

registerAllCommands(program);

program.parse();
