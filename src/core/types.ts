import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<any> = z.ZodObject<any>> {
  /** Unique identifier, used as MCP tool name. e.g., "accounts_list" */
  name: string;

  /** CLI group. e.g., "accounts" */
  group: string;

  /** CLI subcommand name. e.g., "list" */
  subcommand: string;

  /** Human-readable description (used in --help AND MCP tool description) */
  description: string;

  /** Detailed examples for --help output */
  examples?: string[];

  /** Zod schema defining all inputs */
  inputSchema: TInput;

  /** Maps Zod fields to CLI constructs (args and options) */
  cliMappings: CliMapping;

  /** HTTP method and path template (relative to /services/data/vXX.0/) */
  endpoint: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
  };

  /** Where each input field goes in the HTTP request */
  fieldMappings: Record<string, 'path' | 'query' | 'body'>;

  /** Optional key to nest body fields under */
  bodyWrapper?: string;

  /** Whether this is a paginated list endpoint */
  paginated?: boolean;

  /** The handler function */
  handler: (input: z.infer<TInput>, client: SalesforceClient) => Promise<unknown>;
}

export interface SalesforceClient {
  readonly instanceUrl: string;
  readonly apiVersion: string;

  request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    rawPath?: boolean;
  }): Promise<T>;

  /** Issue a request with a raw textual body and explicit content-type (e.g., CSV uploads). */
  requestRaw<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    path: string;
    body: string;
    contentType: string;
    accept?: string;
    rawPath?: boolean;
  }): Promise<T>;

  get<T>(path: string, query?: Record<string, any>): Promise<T>;
  post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string, query?: Record<string, any>): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
}

export interface SalesforceQueryResponse<T = Record<string, unknown>> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

export interface SalesforceConfig {
  access_token: string;
  instance_url: string;
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
  api_version?: string;
}

export interface GlobalOptions {
  accessToken?: string;
  instanceUrl?: string;
  output?: 'json' | 'pretty';
  quiet?: boolean;
  fields?: string;
  pretty?: boolean;
  apiVersion?: string;
}

export const DEFAULT_API_VERSION = 'v62.0';
