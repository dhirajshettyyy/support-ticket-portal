// scripts/setup-plain-workspace.ts
import { plainRequest } from "../lib/plainClient";

interface ThreadFieldSchemaDefinition {
  key: string;
  label: string;
  description: string;
  type: "STRING" | "NUMBER" | "BOOL";
  order: number;
}

const SCHEMAS: ThreadFieldSchemaDefinition[] = [
  {
    key: "product_area",
    label: "Product Area",
    description: "Which part of the product this ticket concerns",
    type: "STRING",
    order: 1,
  },
  {
    key: "ticket_type",
    label: "Ticket Type",
    description: "bug, feature, or question",
    type: "STRING",
    order: 2,
  },
  {
    key: "github_issue_number",
    label: "GitHub Issue Number",
    description: "The linked GitHub issue number",
    type: "NUMBER",
    order: 3,
  },
  {
    key: "github_issue_url",
    label: "GitHub Issue URL",
    description: "The linked GitHub issue URL",
    type: "STRING",
    order: 4,
  },
  {
    key: "needs_github_issue",
    label: "Needs GitHub Issue",
    description: "True if automatic GitHub issue creation failed and needs manual follow-up",
    type: "BOOL",
    order: 5,
  },
];

interface ThreadFieldSchemaList {
  threadFieldSchemas: { edges: Array<{ node: { key: string } }> };
}

async function schemaExists(key: string): Promise<boolean> {
  const query = `
    query ListThreadFieldSchemas {
      threadFieldSchemas(first: 50) {
        edges { node { key } }
      }
    }
  `;
  const data = await plainRequest<ThreadFieldSchemaList>(query, {});
  return data.threadFieldSchemas.edges.some((edge) => edge.node.key === key);
}

async function createSchema(def: ThreadFieldSchemaDefinition): Promise<void> {
  const query = `
    mutation CreateThreadFieldSchema($input: CreateThreadFieldSchemaInput!) {
      createThreadFieldSchema(input: $input) {
        threadFieldSchema { id key }
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    createThreadFieldSchema: {
      threadFieldSchema: { id: string; key: string } | null;
      error: { message: string; code: string } | null;
    };
  }>(query, {
    input: {
      key: def.key,
      label: def.label,
      description: def.description,
      order: def.order,
      type: def.type,
      enumValues: [],
      isRequired: false,
      isAiAutoFillEnabled: false,
    },
  });

  if (data.createThreadFieldSchema.error) {
    throw new Error(`Failed to create schema ${def.key}: ${data.createThreadFieldSchema.error.message}`);
  }

  console.log(`Created thread field schema: ${def.key}`);
}

async function main(): Promise<void> {
  for (const def of SCHEMAS) {
    if (await schemaExists(def.key)) {
      console.log(`Schema already exists, skipping: ${def.key}`);
      continue;
    }
    await createSchema(def);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
