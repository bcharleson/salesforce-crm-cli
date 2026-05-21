import type { SalesforceClient as ISalesforceClient } from './types.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  SalesforceError,
} from './errors.js';

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30_000;
const WRITE_TIMEOUT = 15_000;
const VERSION = '0.1.4';

export interface RefreshCredentials {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
  loginUrl?: string;
}

export type TokenUpdateListener = (newAccessToken: string) => void | Promise<void>;

interface ClientOptions {
  accessToken: string;
  instanceUrl: string;
  apiVersion: string;
  maxRetries?: number;
  timeout?: number;
  refresh?: RefreshCredentials;
  onTokenRefreshed?: TokenUpdateListener;
}

export class SalesforceClient implements ISalesforceClient {
  private accessToken: string;
  private _instanceUrl: string;
  private _apiVersion: string;
  private maxRetries: number;
  private timeout: number;
  private refresh?: RefreshCredentials;
  private onTokenRefreshed?: TokenUpdateListener;

  constructor(options: ClientOptions) {
    this.accessToken = options.accessToken;
    this._instanceUrl = options.instanceUrl.replace(/\/$/, '');
    this._apiVersion = options.apiVersion;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeout = options.timeout ?? REQUEST_TIMEOUT;
    this.refresh = options.refresh;
    this.onTokenRefreshed = options.onTokenRefreshed;
  }

  get instanceUrl(): string {
    return this._instanceUrl;
  }

  get apiVersion(): string {
    return this._apiVersion;
  }

  /** Build the full base path: /services/data/v62.0 */
  private get basePath(): string {
    return `/services/data/${this._apiVersion}`;
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'User-Agent': `salesforce-cli/${VERSION}`,
      ...(extra ?? {}),
    };
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refresh) return false;

    const loginUrl = (this.refresh.loginUrl ?? 'https://login.salesforce.com').replace(/\/$/, '');
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.refresh.clientId,
      refresh_token: this.refresh.refreshToken,
    });
    if (this.refresh.clientSecret) {
      params.set('client_secret', this.refresh.clientSecret);
    }

    try {
      const response = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as { access_token?: string };
      if (!data.access_token) return false;
      this.accessToken = data.access_token;
      if (this.onTokenRefreshed) {
        await this.onTokenRefreshed(data.access_token);
      }
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    rawPath?: boolean;
  }): Promise<T> {
    return this.doRequest<T>({
      method: options.method,
      path: options.path,
      query: options.query,
      jsonBody: options.body,
      rawPath: options.rawPath,
    });
  }

  async requestRaw<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    body: string;
    contentType: string;
    accept?: string;
    rawPath?: boolean;
  }): Promise<T> {
    return this.doRequest<T>({
      method: options.method,
      path: options.path,
      rawBody: options.body,
      contentType: options.contentType,
      accept: options.accept,
      rawPath: options.rawPath,
    });
  }

  private async doRequest<T>(opts: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    jsonBody?: unknown;
    rawBody?: string;
    contentType?: string;
    accept?: string;
    rawPath?: boolean;
  }): Promise<T> {
    const fullPath = opts.rawPath ? opts.path : `${this.basePath}${opts.path}`;
    const url = new URL(this._instanceUrl + fullPath);

    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const hasBody = opts.jsonBody !== undefined || opts.rawBody !== undefined;
    const isWrite = opts.method !== 'GET';
    const effectiveTimeout = isWrite ? Math.min(this.timeout, WRITE_TIMEOUT) : this.timeout;

    let lastError: Error | undefined;
    let didRefresh = false;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        const headers = this.buildHeaders();
        if (hasBody) {
          headers['Content-Type'] =
            opts.contentType ?? (opts.jsonBody !== undefined ? 'application/json' : 'application/octet-stream');
        }
        if (opts.accept) headers['Accept'] = opts.accept;

        const body = opts.rawBody !== undefined
          ? opts.rawBody
          : opts.jsonBody !== undefined
          ? JSON.stringify(opts.jsonBody)
          : undefined;

        const response = await fetch(url.toString(), {
          method: opts.method,
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (response.status === 204) return undefined as T;
          const text = await response.text();
          if (!text) return undefined as T;
          // Honor non-JSON accept: callers using requestRaw with accept !== application/json get text
          if (opts.accept && !opts.accept.includes('json')) {
            return text as unknown as T;
          }
          try {
            return JSON.parse(text) as T;
          } catch {
            return text as unknown as T;
          }
        }

        const errorBody = await response.text().catch(() => '');
        let errorMessage: string;
        try {
          const parsed = JSON.parse(errorBody);
          if (Array.isArray(parsed) && parsed.length > 0) {
            errorMessage = parsed.map((e: any) => `${e.errorCode}: ${e.message}`).join('; ');
          } else {
            errorMessage = parsed.message || parsed.error_description || parsed.error || errorBody;
          }
        } catch {
          errorMessage = errorBody || response.statusText;
        }

        switch (response.status) {
          case 401: {
            // Try one refresh-token retry before giving up
            if (!didRefresh && this.refresh) {
              const ok = await this.refreshAccessToken();
              if (ok) {
                didRefresh = true;
                continue;
              }
            }
            throw new AuthError(errorMessage);
          }
          case 403:
            throw new AuthError(errorMessage);
          case 404:
            throw new NotFoundError(errorMessage);
          case 400:
          case 422:
            throw new ValidationError(errorMessage);
          case 429: {
            const retryAfter = parseInt(response.headers.get('retry-after') ?? '', 10);
            const err = new RateLimitError(errorMessage, isNaN(retryAfter) ? undefined : retryAfter);
            if (attempt < this.maxRetries) {
              const delay = err.retryAfter
                ? err.retryAfter * 1000
                : Math.min(1000 * Math.pow(2, attempt), 10_000);
              await sleep(delay);
              lastError = err;
              continue;
            }
            throw err;
          }
          default:
            if (response.status >= 500) {
              const err = new ServerError(errorMessage, response.status);
              if (attempt < this.maxRetries) {
                await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
                lastError = err;
                continue;
              }
              throw err;
            }
            throw new SalesforceError(errorMessage, 'API_ERROR', response.status);
        }
      } catch (error) {
        if (error instanceof SalesforceError) throw error;

        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || String(error.message).includes('aborted'));

        if (isAbort) {
          lastError = new SalesforceError(
            `Request timed out after ${effectiveTimeout / 1000}s: ${opts.method} ${opts.path}`,
            'TIMEOUT',
          );
          if (!isWrite && attempt < this.maxRetries) {
            await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
            continue;
          }
          throw lastError;
        }

        if (error instanceof TypeError && String(error.message).includes('fetch')) {
          throw new SalesforceError(`Network error: ${error.message}`, 'NETWORK_ERROR');
        }

        throw error;
      }
    }

    throw lastError ?? new SalesforceError('Request failed after retries', 'MAX_RETRIES');
  }

  async get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'POST', path, query, body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  async delete<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, query });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
