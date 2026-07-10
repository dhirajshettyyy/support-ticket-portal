const PLAIN_API_URL = "https://core-api.uk.plain.com/graphql/v1";

export interface MutationFieldError {
  field: string;
  message: string;
  type: string;
}

export interface MutationErrorPayload {
  message: string;
  code: string;
  fields?: MutationFieldError[];
}

export class PlainApiError extends Error {
  code?: string;
  fields?: MutationFieldError[];

  constructor(message: string, code?: string, fields?: MutationFieldError[]) {
    super(message);
    this.name = "PlainApiError";
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Plain's field-level validation errors (e.g. on createThread/upsertCustomer)
 * are only visible via error.fields, not the top-level message. Fold them
 * into the thrown error's message so they show up in server logs without
 * needing a second lookup.
 */
export function formatMutationError(error: MutationErrorPayload | null | undefined, fallback: string): string {
  if (!error) return fallback;
  if (!error.fields || error.fields.length === 0) return error.message;
  const details = error.fields.map((f) => `${f.field}: ${f.message}`).join("; ");
  return `${error.message} (${details})`;
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function plainRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.PLAIN_API_KEY;
  if (!apiKey) {
    throw new PlainApiError("PLAIN_API_KEY is not set");
  }

  const response = await fetch(PLAIN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as GraphqlResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new PlainApiError(json.errors[0].message);
  }

  if (!json.data) {
    throw new PlainApiError("Plain API returned no data");
  }

  return json.data;
}
