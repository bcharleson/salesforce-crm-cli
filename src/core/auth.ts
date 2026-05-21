import { loadConfig, saveConfig } from './config.js';
import { AuthError } from './errors.js';
import { DEFAULT_API_VERSION } from './types.js';
import type { RefreshCredentials, TokenUpdateListener } from './client.js';

export interface ResolvedAuth {
  accessToken: string;
  instanceUrl: string;
  apiVersion: string;
  refresh?: RefreshCredentials;
  onTokenRefreshed?: TokenUpdateListener;
}

export async function resolveAuth(flags?: {
  accessToken?: string;
  instanceUrl?: string;
  apiVersion?: string;
}): Promise<ResolvedAuth> {
  // 1. CLI flags take highest priority
  const flagToken = flags?.accessToken;
  const flagInstance = flags?.instanceUrl;
  const envToken = process.env.SALESFORCE_ACCESS_TOKEN ?? process.env.SF_ACCESS_TOKEN;
  const envInstance = process.env.SALESFORCE_INSTANCE_URL ?? process.env.SF_INSTANCE_URL;
  const envApiVersion = process.env.SALESFORCE_API_VERSION ?? process.env.SF_API_VERSION;

  // Optional refresh material via env (preferred for sandboxed agents)
  const envRefreshToken = process.env.SALESFORCE_REFRESH_TOKEN ?? process.env.SF_REFRESH_TOKEN;
  const envClientId = process.env.SALESFORCE_CLIENT_ID ?? process.env.SF_CLIENT_ID;
  const envClientSecret = process.env.SALESFORCE_CLIENT_SECRET ?? process.env.SF_CLIENT_SECRET;
  const envLoginUrl = process.env.SALESFORCE_LOGIN_URL ?? process.env.SF_LOGIN_URL;

  // Load stored config (used as fallback and as the destination for refreshed tokens)
  const stored = await loadConfig();

  const accessToken = flagToken ?? envToken ?? stored?.access_token;
  const instanceUrl = flagInstance ?? envInstance ?? stored?.instance_url;
  const apiVersion = flags?.apiVersion ?? envApiVersion ?? stored?.api_version ?? DEFAULT_API_VERSION;

  if (!accessToken || !instanceUrl) {
    throw new AuthError(
      'No credentials found. Set SALESFORCE_ACCESS_TOKEN + SALESFORCE_INSTANCE_URL, use --access-token + --instance-url, or run: salesforce login',
    );
  }

  // Build refresh credential bundle if available — env wins over stored
  const refreshToken = envRefreshToken ?? stored?.refresh_token;
  const clientId = envClientId ?? stored?.client_id;
  const clientSecret = envClientSecret ?? stored?.client_secret;
  const loginUrl = envLoginUrl;

  let refresh: RefreshCredentials | undefined;
  let onTokenRefreshed: TokenUpdateListener | undefined;

  if (refreshToken && clientId) {
    refresh = { refreshToken, clientId, clientSecret, loginUrl };

    // Only persist refreshed tokens back to disk if they originally came from the config file.
    // For env-driven setups, the host is responsible for the env; we just update in-memory.
    if (stored?.access_token === accessToken) {
      onTokenRefreshed = async (newAccessToken: string) => {
        await saveConfig({
          ...stored,
          access_token: newAccessToken,
        });
      };
    }
  }

  return {
    accessToken,
    instanceUrl: instanceUrl.replace(/\/$/, ''),
    apiVersion,
    refresh,
    onTokenRefreshed,
  };
}
