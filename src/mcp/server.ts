import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allCommands } from '../commands/index.js';
import { resolveAuth } from '../core/auth.js';
import { SalesforceClient } from '../core/client.js';
import { saveConfig, deleteConfig } from '../core/config.js';
import type { SalesforceConfig } from '../core/types.js';
import { VERSION } from '../version.js';

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'salesforce',
    version: VERSION,
  });

  // Lazy client: do NOT resolve auth at startup. If credentials are missing or invalid,
  // we want the agent to still see the tool catalog and get a structured error on first call.
  let cachedClient: SalesforceClient | null = null;
  let cachedAuthError: string | null = null;

  async function getClient(): Promise<SalesforceClient> {
    if (cachedClient) return cachedClient;
    try {
      const auth = await resolveAuth();
      cachedClient = new SalesforceClient(auth);
      cachedAuthError = null;
      return cachedClient;
    } catch (error: any) {
      cachedAuthError = error?.message ?? String(error);
      throw error;
    }
  }

  // Register every CommandDefinition as an MCP tool
  for (const cmdDef of allCommands) {
    const shape = cmdDef.inputSchema.shape;

    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          const client = await getClient();
          const result = await cmdDef.handler(args, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error.message ?? String(error),
                  code: error.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // Diagnostic tool — agents can call this to probe configuration without touching the API.
  server.registerTool(
    'salesforce_status',
    {
      description:
        'Report MCP server configuration and authentication status. Returns { authenticated, instance_url, api_version, source, user?, org_id?, error? }. Safe to call at any time.',
      inputSchema: {},
    },
    async () => {
      try {
        const client = await getClient();
        // Probe userinfo to confirm token is live
        const userinfo = await fetch(`${client.instanceUrl}/services/oauth2/userinfo`, {
          headers: { Authorization: `Bearer ${(client as any).accessToken}` },
        });
        const identity = userinfo.ok ? ((await userinfo.json()) as Record<string, unknown>) : {};
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                authenticated: userinfo.ok,
                instance_url: client.instanceUrl,
                api_version: client.apiVersion,
                user: identity.name,
                email: identity.email,
                org_id: identity.organization_id,
              }),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                authenticated: false,
                error: error.message ?? String(error),
                code: error.code ?? 'AUTH_ERROR',
                hint: cachedAuthError ?? undefined,
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Login tool — lets an agent prompt the user for credentials at runtime.
  // Persists to ~/.salesforce-cli/config.json and invalidates the cached client.
  server.registerTool(
    'salesforce_login',
    {
      description:
        'Authenticate this MCP server with Salesforce. Prompt the user for credentials and call this tool to persist them. Two modes: (A) access_token + instance_url for a direct session token, or (B) client_id + username + password for OAuth username/password flow (returns a refresh token for auto-renewal). After success, all other tools become available immediately.',
      inputSchema: {
        access_token: z
          .string()
          .optional()
          .describe('Salesforce session ID or bearer token. Use with instance_url for token-mode login.'),
        instance_url: z
          .string()
          .optional()
          .describe('Salesforce instance URL, e.g. https://acmecorp.my.salesforce.com. Required for token-mode login.'),
        client_id: z
          .string()
          .optional()
          .describe('Connected App consumer key. Required for OAuth username/password login.'),
        client_secret: z
          .string()
          .optional()
          .describe('Connected App consumer secret. Optional for OAuth (depends on app config).'),
        username: z.string().optional().describe('Salesforce login email. Required for OAuth login.'),
        password: z
          .string()
          .optional()
          .describe('Salesforce password concatenated with security token. Required for OAuth login.'),
        login_url: z
          .string()
          .optional()
          .describe('OAuth login endpoint. Default: https://login.salesforce.com. Use https://test.salesforce.com for sandboxes.'),
      },
    },
    async (args: Record<string, unknown>) => {
      try {
        const opts = args as {
          access_token?: string;
          instance_url?: string;
          client_id?: string;
          client_secret?: string;
          username?: string;
          password?: string;
          login_url?: string;
        };

        let saved: SalesforceConfig;

        // Path A — direct access token
        if (opts.access_token && opts.instance_url) {
          const instanceUrl = opts.instance_url.replace(/\/$/, '');
          const probe = await fetch(`${instanceUrl}/services/data/`, {
            headers: { Authorization: `Bearer ${opts.access_token}` },
          });
          if (!probe.ok) {
            throw new Error('Invalid access token or instance URL (probe failed)');
          }
          saved = { access_token: opts.access_token, instance_url: instanceUrl };
        }
        // Path B — OAuth username/password
        else if (opts.client_id && opts.username && opts.password) {
          const loginUrl = (opts.login_url ?? 'https://login.salesforce.com').replace(/\/$/, '');
          const params = new URLSearchParams({
            grant_type: 'password',
            client_id: opts.client_id,
            username: opts.username,
            password: opts.password,
          });
          if (opts.client_secret) params.set('client_secret', opts.client_secret);

          const response = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });
          if (!response.ok) {
            const err = (await response.json().catch(() => ({}))) as any;
            throw new Error(err.error_description || err.error || 'OAuth authentication failed');
          }
          const data = (await response.json()) as {
            access_token: string;
            instance_url: string;
            refresh_token?: string;
          };
          saved = {
            access_token: data.access_token,
            instance_url: data.instance_url,
            client_id: opts.client_id,
          };
          if (opts.client_secret) saved.client_secret = opts.client_secret;
          if (data.refresh_token) saved.refresh_token = data.refresh_token;
        } else {
          throw new Error(
            'Provide either (access_token + instance_url) or (client_id + username + password). See tool description for details.',
          );
        }

        await saveConfig(saved);
        // Invalidate the cached client so the next tool call picks up new creds
        cachedClient = null;
        cachedAuthError = null;

        // Verify by hitting userinfo
        const userinfo = await fetch(`${saved.instance_url}/services/oauth2/userinfo`, {
          headers: { Authorization: `Bearer ${saved.access_token}` },
        });
        const identity = userinfo.ok ? ((await userinfo.json()) as Record<string, unknown>) : {};

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                authenticated: true,
                instance_url: saved.instance_url,
                user: identity.name,
                email: identity.email,
                org_id: identity.organization_id,
                refresh_token_stored: Boolean(saved.refresh_token),
              }),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                authenticated: false,
                error: error.message ?? String(error),
                code: error.code ?? 'LOGIN_FAILED',
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Logout tool — removes stored credentials.
  server.registerTool(
    'salesforce_logout',
    {
      description:
        'Remove stored Salesforce credentials from this MCP server. Subsequent tool calls will require re-authentication via salesforce_login.',
      inputSchema: {},
    },
    async () => {
      await deleteConfig();
      cachedClient = null;
      cachedAuthError = null;
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ status: 'logged_out' }) }],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`Salesforce MCP server v${VERSION} started. Tools registered: ${allCommands.length + 3}`);
}
