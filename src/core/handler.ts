import type { CommandDefinition, SalesforceClient } from './types.js';

/**
 * Builds an HTTP request from a CommandDefinition and its input,
 * then executes it using the client.
 *
 * Supports bodyWrapper — when set, all body fields are nested under
 * that key (e.g., bodyWrapper: "attributes" → { attributes: { ...body } })
 */
export async function executeCommand(
  cmdDef: CommandDefinition,
  input: Record<string, any>,
  client: SalesforceClient,
): Promise<unknown> {
  let path = cmdDef.endpoint.path;
  const query: Record<string, any> = {};
  const body: Record<string, any> = {};

  for (const [field, location] of Object.entries(cmdDef.fieldMappings)) {
    const value = input[field];
    if (value === undefined) continue;

    switch (location) {
      case 'path':
        path = path.replace(`{${field}}`, encodeURIComponent(String(value)));
        break;
      case 'query':
        query[field] = value;
        break;
      case 'body':
        body[field] = value;
        break;
    }
  }

  const hasBody = Object.keys(body).length > 0;
  const hasQuery = Object.keys(query).length > 0;

  const finalBody = hasBody
    ? cmdDef.bodyWrapper
      ? { [cmdDef.bodyWrapper]: body }
      : body
    : undefined;

  const result = await client.request({
    method: cmdDef.endpoint.method,
    path,
    query: hasQuery ? query : undefined,
    body: finalBody,
  });

  // DELETE returns 204 No Content (undefined) — return a confirmation object
  if (result === undefined && cmdDef.endpoint.method === 'DELETE') {
    const segments = path.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    return { status: 'deleted', id };
  }

  return result;
}
