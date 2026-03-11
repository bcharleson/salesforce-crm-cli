import { Command } from 'commander';
import { loadConfig, getConfigPath } from '../../core/config.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      const globalOpts = program.opts() as GlobalOptions;
      const config = await loadConfig();

      const envToken = process.env.SALESFORCE_ACCESS_TOKEN || process.env.SF_ACCESS_TOKEN;
      const envInstance = process.env.SALESFORCE_INSTANCE_URL || process.env.SF_INSTANCE_URL;

      if (!config && !envToken) {
        if (globalOpts.output === 'pretty' || globalOpts.pretty) {
          console.log('Not authenticated. Run: salesforce login');
        } else {
          console.log(JSON.stringify({ authenticated: false }));
        }
        return;
      }

      const accessToken = envToken ?? config?.access_token;
      const instanceUrl = envInstance ?? config?.instance_url;
      const source = envToken ? 'environment' : 'config';

      // Validate token is still good
      let valid = false;
      let identity: Record<string, unknown> = {};
      if (accessToken && instanceUrl) {
        try {
          const response = await fetch(`${instanceUrl}/services/oauth2/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (response.ok) {
            valid = true;
            identity = await response.json() as Record<string, unknown>;
          }
        } catch {
          // Token might be expired
        }
      }

      const result = {
        authenticated: valid,
        source,
        instance_url: instanceUrl,
        config_path: getConfigPath(),
        ...(valid && identity.name ? { user: identity.name } : {}),
        ...(valid && identity.email ? { email: identity.email } : {}),
        ...(valid && identity.organization_id ? { org_id: identity.organization_id } : {}),
      };

      if (globalOpts.output === 'pretty' || globalOpts.pretty) {
        console.log(`Authenticated: ${valid ? 'Yes' : 'No (token may be expired)'}`);
        console.log(`Source: ${source}`);
        console.log(`Instance: ${instanceUrl}`);
        if (identity.name) console.log(`User: ${identity.name}`);
        if (identity.email) console.log(`Email: ${identity.email}`);
        console.log(`Config: ${getConfigPath()}`);
      } else {
        console.log(JSON.stringify(result));
      }
    });
}
