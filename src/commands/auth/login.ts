import { Command } from 'commander';
import { saveConfig } from '../../core/config.js';
import type { SalesforceConfig } from '../../core/types.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with Salesforce using OAuth username-password flow or access token')
    .option('--access-token <token>', 'Salesforce access token (session ID or OAuth token)')
    .option('--instance-url <url>', 'Salesforce instance URL (e.g., https://na1.salesforce.com)')
    .option('--client-id <id>', 'Connected App consumer key (for OAuth)')
    .option('--client-secret <secret>', 'Connected App consumer secret (for OAuth)')
    .option('--username <username>', 'Salesforce username (for OAuth password flow)')
    .option('--password <password>', 'Salesforce password + security token (for OAuth password flow)')
    .option('--login-url <url>', 'Login endpoint (default: https://login.salesforce.com)', 'https://login.salesforce.com')
    .action(async (opts) => {
      try {
        // Path 1: Direct access token + instance URL
        if (opts.accessToken && opts.instanceUrl) {
          // Validate by calling the API
          const response = await fetch(`${opts.instanceUrl}/services/data/`, {
            headers: { Authorization: `Bearer ${opts.accessToken}` },
          });

          if (!response.ok) {
            console.error('Error: Invalid access token or instance URL');
            process.exitCode = 1;
            return;
          }

          const config: SalesforceConfig = {
            access_token: opts.accessToken,
            instance_url: opts.instanceUrl.replace(/\/$/, ''),
          };
          await saveConfig(config);
          console.log(`Authenticated successfully. Instance: ${opts.instanceUrl}`);
          return;
        }

        // Path 2: OAuth username-password flow
        if (opts.clientId && opts.username && opts.password) {
          const params = new URLSearchParams({
            grant_type: 'password',
            client_id: opts.clientId,
            username: opts.username,
            password: opts.password,
          });
          if (opts.clientSecret) {
            params.set('client_secret', opts.clientSecret);
          }

          const response = await fetch(`${opts.loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error_description: 'Authentication failed' }));
            console.error(`Error: ${(error as any).error_description || 'Authentication failed'}`);
            process.exitCode = 1;
            return;
          }

          const data = await response.json() as {
            access_token: string;
            instance_url: string;
            refresh_token?: string;
            id: string;
          };

          const config: SalesforceConfig = {
            access_token: data.access_token,
            instance_url: data.instance_url,
            client_id: opts.clientId,
            client_secret: opts.clientSecret,
          };
          if (data.refresh_token) {
            config.refresh_token = data.refresh_token;
          }

          await saveConfig(config);
          console.log(`Authenticated successfully as ${opts.username}`);
          console.log(`Instance: ${data.instance_url}`);
          return;
        }

        // Path 3: Interactive prompt (if TTY available)
        if (process.stdin.isTTY) {
          const { input } = await import('@inquirer/prompts');

          const loginMethod = await input({
            message: 'Login method (token/oauth):',
            default: 'token',
          });

          if (loginMethod === 'token') {
            const accessToken = await input({ message: 'Access token:' });
            const instanceUrl = await input({ message: 'Instance URL (e.g., https://na1.salesforce.com):' });

            const response = await fetch(`${instanceUrl}/services/data/`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
              console.error('Error: Invalid access token or instance URL');
              process.exitCode = 1;
              return;
            }

            await saveConfig({ access_token: accessToken, instance_url: instanceUrl.replace(/\/$/, '') });
            console.log(`Authenticated successfully. Instance: ${instanceUrl}`);
          } else {
            const clientId = await input({ message: 'Connected App client ID:' });
            const clientSecret = await input({ message: 'Client secret (optional):' });
            const username = await input({ message: 'Username:' });
            const password = await input({ message: 'Password + security token:' });
            const loginUrl = await input({ message: 'Login URL:', default: 'https://login.salesforce.com' });

            const params = new URLSearchParams({
              grant_type: 'password',
              client_id: clientId,
              username,
              password,
            });
            if (clientSecret) params.set('client_secret', clientSecret);

            const response = await fetch(`${loginUrl}/services/oauth2/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString(),
            });

            if (!response.ok) {
              const error = await response.json().catch(() => ({ error_description: 'Authentication failed' }));
              console.error(`Error: ${(error as any).error_description || 'Authentication failed'}`);
              process.exitCode = 1;
              return;
            }

            const data = await response.json() as { access_token: string; instance_url: string; refresh_token?: string };
            const config: SalesforceConfig = {
              access_token: data.access_token,
              instance_url: data.instance_url,
              client_id: clientId,
              client_secret: clientSecret || undefined,
            };
            if (data.refresh_token) config.refresh_token = data.refresh_token;
            await saveConfig(config);
            console.log(`Authenticated successfully. Instance: ${data.instance_url}`);
          }
          return;
        }

        console.error('Error: Provide --access-token + --instance-url, or --client-id + --username + --password for OAuth');
        process.exitCode = 1;
      } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exitCode = 1;
      }
    });
}
