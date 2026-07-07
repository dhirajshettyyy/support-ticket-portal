const PLAIN_API_URL = "https://core-api.uk.plain.com/graphql/v1";

export class PlainApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "PlainApiError";
    this.code = code;
  }
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
