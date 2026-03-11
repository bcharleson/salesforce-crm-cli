import { loadConfig } from './config.js';
import { AuthError } from './errors.js';
import { DEFAULT_API_VERSION } from './types.js';

export interface ResolvedAuth {
  accessToken: string;
  instanceUrl: string;
  apiVersion: string;
}

export async function resolveAuth(flags?: {
  accessToken?: string;
  instanceUrl?: string;
  apiVersion?: string;
}): Promise<ResolvedAuth> {
  // 1. CLI flags take highest priority
  const accessToken =
    flags?.accessToken ??
    process.env.SALESFORCE_ACCESS_TOKEN ??
    process.env.SF_ACCESS_TOKEN;

  const instanceUrl =
    flags?.instanceUrl ??
    process.env.SALESFORCE_INSTANCE_URL ??
    process.env.SF_INSTANCE_URL;

  const apiVersion =
    flags?.apiVersion ??
    process.env.SALESFORCE_API_VERSION ??
    process.env.SF_API_VERSION;

  // 2. If we have both from flags/env, use them
  if (accessToken && instanceUrl) {
    return {
      accessToken,
      instanceUrl: instanceUrl.replace(/\/$/, ''),
      apiVersion: apiVersion ?? DEFAULT_API_VERSION,
    };
  }

  // 3. Fall back to stored config
  const config = await loadConfig();
  if (config?.access_token && config?.instance_url) {
    return {
      accessToken: accessToken ?? config.access_token,
      instanceUrl: (instanceUrl ?? config.instance_url).replace(/\/$/, ''),
      apiVersion: apiVersion ?? config.api_version ?? DEFAULT_API_VERSION,
    };
  }

  throw new AuthError(
    'No credentials found. Set SALESFORCE_ACCESS_TOKEN + SALESFORCE_INSTANCE_URL, use --access-token + --instance-url, or run: salesforce login',
  );
}
