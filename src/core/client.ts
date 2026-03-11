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
const VERSION = '0.1.0';

interface ClientOptions {
  accessToken: string;
  instanceUrl: string;
  apiVersion: string;
  maxRetries?: number;
  timeout?: number;
}

export class SalesforceClient implements ISalesforceClient {
  private accessToken: string;
  private instanceUrl: string;
  private apiVersion: string;
  private maxRetries: number;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.accessToken = options.accessToken;
    this.instanceUrl = options.instanceUrl.replace(/\/$/, '');
    this.apiVersion = options.apiVersion;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeout = options.timeout ?? REQUEST_TIMEOUT;
  }

  /** Build the full base path: /services/data/v62.0 */
  private get basePath(): string {
    return `/services/data/${this.apiVersion}`;
  }

  async request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    rawPath?: boolean;
  }): Promise<T> {
    // rawPath = true means path is already fully qualified (e.g., nextRecordsUrl)
    const fullPath = options.rawPath ? options.path : `${this.basePath}${options.path}`;
    const url = new URL(this.instanceUrl + fullPath);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'User-Agent': `salesforce-cli/${VERSION}`,
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error | undefined;
    const isWrite = options.method !== 'GET';
    const effectiveTimeout = isWrite ? Math.min(this.timeout, WRITE_TIMEOUT) : this.timeout;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

        const response = await fetch(url.toString(), {
          method: options.method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // 204 No Content
          if (response.status === 204) return undefined as T;
          const text = await response.text();
          if (!text) return undefined as T;
          return JSON.parse(text) as T;
        }

        const errorBody = await response.text().catch(() => '');
        let errorMessage: string;
        try {
          const parsed = JSON.parse(errorBody);
          // Salesforce returns errors as an array: [{ message, errorCode, fields }]
          if (Array.isArray(parsed) && parsed.length > 0) {
            errorMessage = parsed.map((e: any) => `${e.errorCode}: ${e.message}`).join('; ');
          } else {
            errorMessage = parsed.message || parsed.error_description || parsed.error || errorBody;
          }
        } catch {
          errorMessage = errorBody || response.statusText;
        }

        switch (response.status) {
          case 401:
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
            `Request timed out after ${effectiveTimeout / 1000}s: ${options.method} ${options.path}`,
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
