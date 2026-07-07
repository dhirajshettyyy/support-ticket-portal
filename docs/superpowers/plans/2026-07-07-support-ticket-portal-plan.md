# Support Ticket Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app where customers submit a structured ticket that is created simultaneously as a Plain thread and a GitHub issue, cross-linked and kept in sync on close.

**Architecture:** A single Next.js (App Router) app, no database. `POST /api/tickets` orchestrates the dual write. Two webhook routes (`/api/webhooks/github`, `/api/webhooks/plain`) keep status in sync in both directions. See `docs/superpowers/specs/2026-07-07-support-ticket-portal-design.md` for the approved design.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Vitest for tests, no ORM/database.

## Global Constraints

- Node.js >= 18.18 (Next.js 15 requirement).
- No database, queue, or worker process — matches the approved spec's "Out of Scope" section.
- Plain GraphQL endpoint (confirmed from Plain's public schema host): `https://core-api.uk.plain.com/graphql/v1`.
- GitHub REST API base: `https://api.github.com`, header `X-GitHub-Api-Version: 2022-11-28`.
- Plain webhook signature: header `Plain-Request-Signature`, value = `HMAC-SHA256(secret, rawBody)` as a hex string. No timestamp component. (Source: `https://www.plain.com/docs/request-signing`.)
- GitHub webhook signature: header `X-Hub-Signature-256`, value = `sha256=` + `HMAC-SHA256(secret, rawBody)` as a hex string. (GitHub standard.)
- Plain `ThreadStatus` enum: `TODO`, `SNOOZED`, `DONE` (confirmed from Plain's public GraphQL schema).
- Plain thread `priority: Int` — 0 = urgent, 1 = high, 2 = normal (default), 3 = low (confirmed from schema).
- Plain structured data is stored via **Thread Field Schemas** (key + type, created once per workspace via `createThreadFieldSchema`, then set per-thread via `upsertThreadField`/`CreateThreadInput.threadFields`). We use `STRING`/`NUMBER`/`BOOL` types, not `ENUM`, since our own form already constrains the allowed values — this avoids managing enum value lists on both sides (YAGNI).
- The spec's "tag the Plain thread `needs-github-issue`" requirement is implemented as a `BOOL` thread field (`needs_github_issue`), not a Plain Label, to avoid a second one-time admin setup step (creating Label Types) for data we're already representing as thread fields.
- Severity is represented only via the native `priority` field on the thread, not also as a separate thread field — storing it twice would be duplicate data with no benefit, since `priority` is already filterable/sortable in Plain's UI.
- `UpsertCustomerOnUpdateInput` (used when a customer already exists) has no `tenantIdentifiers` field — only `UpsertCustomerOnCreateInput` does. So `upsertCustomer` always additionally calls `addCustomerToTenants` when a tenant is given, to guarantee the link for both new and returning customers.
- All Plain mutation/query field names below were confirmed by downloading Plain's public GraphQL SDL schema (`https://core-api.uk.plain.com/graphql/v1/schema.graphql`) and inspecting the exact type definitions — they are not guessed.

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Produces: a working Next.js dev/build setup, a `vitest` test runner wired to run `**/*.test.ts`, and the `@/*` import alias resolving to the project root — every later task's tests depend on this wiring.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "support-ticket-portal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "setup:plain": "tsx scripts/setup-plain-workspace.ts"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "vitest": "^2.1.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 4: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 6: Write `app/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Support Ticket Portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Write a placeholder `app/page.tsx`** (Task 9 replaces this with the real form)

```tsx
export default function Home() {
  return <main>Support ticket portal coming soon.</main>;
}
```

- [ ] **Step 8: Write `.gitignore`**

```
node_modules
.next
.env
.env.local
dist
coverage
```

- [ ] **Step 9: Write `.env.example`**

```
PLAIN_API_KEY=
GITHUB_TOKEN=
GITHUB_REPO=owner/repo
GITHUB_WEBHOOK_SECRET=
PLAIN_WEBHOOK_SECRET=
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: completes with no errors, creates `package-lock.json`.

- [ ] **Step 11: Verify the vitest wiring**

Create a throwaway file `smoke.test.ts` at the project root:

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: `1 passed`

Delete `smoke.test.ts` — it was only to confirm the runner works.

- [ ] **Step 12: Verify the build**

Run: `npm run build`
Expected: build completes successfully, printing the `/` route.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json tsconfig.json next-env.d.ts next.config.mjs vitest.config.ts app/layout.tsx app/page.tsx .gitignore .env.example
git commit -m "Scaffold Next.js project with TypeScript and Vitest"
```

---

### Task 2: Taxonomy constants

**Files:**
- Create: `lib/taxonomy.ts`
- Test: `lib/__tests__/taxonomy.test.ts`

**Interfaces:**
- Produces: `Severity`, `ProductArea`, `TicketType` types; `SEVERITIES`, `PRODUCT_AREAS`, `TICKET_TYPES` arrays; `severityToPlainPriority(severity: Severity): number`; `severityToGithubLabel`, `productAreaToGithubLabel`, `ticketTypeToGithubLabel` (each `(value) => string`). Consumed by the form UI (Task 9), the orchestration route (Task 8), and the setup script (Task 6 references the field keys, not this file directly).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/taxonomy.test.ts
import { describe, it, expect } from "vitest";
import {
  severityToPlainPriority,
  severityToGithubLabel,
  productAreaToGithubLabel,
  ticketTypeToGithubLabel,
  SEVERITIES,
  PRODUCT_AREAS,
  TICKET_TYPES,
} from "../taxonomy";

describe("taxonomy", () => {
  it("maps severity to Plain priority, most urgent to lowest int", () => {
    expect(severityToPlainPriority("urgent")).toBe(0);
    expect(severityToPlainPriority("high")).toBe(1);
    expect(severityToPlainPriority("medium")).toBe(2);
    expect(severityToPlainPriority("low")).toBe(3);
  });

  it("formats GitHub labels with a namespaced prefix", () => {
    expect(severityToGithubLabel("high")).toBe("severity:high");
    expect(productAreaToGithubLabel("billing")).toBe("area:billing");
    expect(ticketTypeToGithubLabel("bug")).toBe("type:bug");
  });

  it("exposes the full option lists for the form", () => {
    expect(SEVERITIES).toEqual(["low", "medium", "high", "urgent"]);
    expect(PRODUCT_AREAS).toEqual(["billing", "onboarding", "api", "dashboard", "other"]);
    expect(TICKET_TYPES).toEqual(["bug", "feature", "question"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/taxonomy.test.ts`
Expected: FAIL with "Cannot find module '../taxonomy'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/taxonomy.ts
export type Severity = "low" | "medium" | "high" | "urgent";
export type ProductArea = "billing" | "onboarding" | "api" | "dashboard" | "other";
export type TicketType = "bug" | "feature" | "question";

export const SEVERITIES: Severity[] = ["low", "medium", "high", "urgent"];
export const PRODUCT_AREAS: ProductArea[] = ["billing", "onboarding", "api", "dashboard", "other"];
export const TICKET_TYPES: TicketType[] = ["bug", "feature", "question"];

const SEVERITY_TO_PRIORITY: Record<Severity, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function severityToPlainPriority(severity: Severity): number {
  return SEVERITY_TO_PRIORITY[severity];
}

export function severityToGithubLabel(severity: Severity): string {
  return `severity:${severity}`;
}

export function productAreaToGithubLabel(area: ProductArea): string {
  return `area:${area}`;
}

export function ticketTypeToGithubLabel(type: TicketType): string {
  return `type:${type}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/taxonomy.test.ts`
Expected: `3 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/taxonomy.ts lib/__tests__/taxonomy.test.ts
git commit -m "Add ticket taxonomy constants and label mappings"
```

---

### Task 3: Webhook signature verification

**Files:**
- Create: `lib/webhookSignatures.ts`
- Test: `lib/__tests__/webhookSignatures.test.ts`

**Interfaces:**
- Produces: `verifyGithubSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean`, `verifyPlainSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean`. Consumed by the two webhook routes (Tasks 10 and 11).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/webhookSignatures.test.ts
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyGithubSignature, verifyPlainSignature } from "../webhookSignatures";

const SECRET = "test-secret";
const BODY = JSON.stringify({ hello: "world" });

describe("verifyGithubSignature", () => {
  it("accepts a correctly signed body", () => {
    const signature = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyGithubSignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyGithubSignature(BODY + "x", signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyGithubSignature(BODY, null, SECRET)).toBe(false);
  });

  it("rejects a malformed signature", () => {
    expect(verifyGithubSignature(BODY, "sha256=deadbeef", SECRET)).toBe(false);
  });
});

describe("verifyPlainSignature", () => {
  it("accepts a correctly signed body", () => {
    const signature = createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyPlainSignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyPlainSignature(BODY + "x", signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyPlainSignature(BODY, null, SECRET)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/webhookSignatures.test.ts`
Expected: FAIL with "Cannot find module '../webhookSignatures'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/webhookSignatures.ts
import { createHmac, timingSafeEqual } from "node:crypto";

function safeCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function verifyGithubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signatureHeader);
}

export function verifyPlainSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signatureHeader);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/webhookSignatures.test.ts`
Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/webhookSignatures.ts lib/__tests__/webhookSignatures.test.ts
git commit -m "Add GitHub and Plain webhook signature verification"
```

---

### Task 4: Cross-link marker helpers

**Files:**
- Create: `lib/ticketLink.ts`
- Test: `lib/__tests__/ticketLink.test.ts`

**Interfaces:**
- Produces: `buildGithubIssueBody(params: { description: string; plainThreadRef: string; plainThreadId: string }): string`, `parsePlainThreadId(issueBody: string | null): string | null`. Consumed by the orchestration route (Task 8) and the GitHub webhook route (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/ticketLink.test.ts
import { describe, it, expect } from "vitest";
import { buildGithubIssueBody, parsePlainThreadId } from "../ticketLink";

describe("buildGithubIssueBody", () => {
  it("includes the description, ref, and a parseable marker", () => {
    const body = buildGithubIssueBody({
      description: "Cannot log in with SSO",
      plainThreadRef: "T-123",
      plainThreadId: "th_abc",
    });
    expect(body).toContain("Cannot log in with SSO");
    expect(body).toContain("T-123");
    expect(body).toContain("<!-- plain-thread-id: th_abc -->");
  });
});

describe("parsePlainThreadId", () => {
  it("extracts the thread id from a body containing the marker", () => {
    const body = "Some text\n<!-- plain-thread-id: th_abc -->";
    expect(parsePlainThreadId(body)).toBe("th_abc");
  });

  it("returns null when there is no marker", () => {
    expect(parsePlainThreadId("A regular GitHub issue with no marker")).toBeNull();
  });

  it("returns null for a null body", () => {
    expect(parsePlainThreadId(null)).toBeNull();
  });

  it("round-trips with buildGithubIssueBody", () => {
    const body = buildGithubIssueBody({
      description: "desc",
      plainThreadRef: "T-9",
      plainThreadId: "th_xyz",
    });
    expect(parsePlainThreadId(body)).toBe("th_xyz");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/ticketLink.test.ts`
Expected: FAIL with "Cannot find module '../ticketLink'"

- [ ] **Step 3: Write the implementation**

```ts
// lib/ticketLink.ts
const MARKER_REGEX = /<!--\s*plain-thread-id:\s*([^\s]+)\s*-->/;

export function buildGithubIssueBody(params: {
  description: string;
  plainThreadRef: string;
  plainThreadId: string;
}): string {
  return [
    params.description,
    "",
    "---",
    `Plain ticket: ${params.plainThreadRef}`,
    `<!-- plain-thread-id: ${params.plainThreadId} -->`,
  ].join("\n");
}

export function parsePlainThreadId(issueBody: string | null): string | null {
  if (!issueBody) return null;
  const match = issueBody.match(MARKER_REGEX);
  return match ? match[1] : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/ticketLink.test.ts`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add lib/ticketLink.ts lib/__tests__/ticketLink.test.ts
git commit -m "Add helpers to cross-link GitHub issues and Plain threads"
```

---

### Task 5: Plain API client

**Files:**
- Create: `lib/plainClient.ts`
- Create: `lib/plain.ts`
- Test: `lib/__tests__/plain.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `plainRequest<T>(query: string, variables: Record<string, unknown>): Promise<T>` and `PlainApiError` from `lib/plainClient.ts`. From `lib/plain.ts`: `upsertTenant({ externalId, name }): Promise<{ tenantId: string }>`, `upsertCustomer({ email, fullName, tenantExternalId? }): Promise<{ customerId: string }>`, `createThread({ customerId, tenantExternalId?, title, description, priority, threadFields }): Promise<{ threadId: string; ref: string }>` where `threadFields: Array<{ key: string; type: "STRING" | "NUMBER" | "BOOL"; stringValue?: string; numberValue?: number; booleanValue?: boolean }>`, `upsertThreadField(params: { threadId: string; key: string; type: "STRING" | "NUMBER" | "BOOL"; stringValue?: string; numberValue?: number; booleanValue?: boolean }): Promise<void>`, `markThreadAsDone(threadId: string): Promise<void>`, `getThread(threadId: string): Promise<{ id: string; status: "TODO" | "SNOOZED" | "DONE"; threadFields: Array<{ key: string; stringValue: string | null; numberValue: number | null }> } | null>`. Consumed by Task 6 (setup script), Task 8 (orchestration route), Task 10 and 11 (webhook routes).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/plain.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  upsertTenant,
  upsertCustomer,
  createThread,
  upsertThreadField,
  markThreadAsDone,
  getThread,
} from "../plain";
import { PlainApiError } from "../plainClient";

function mockFetchOnce(data: unknown, errors?: Array<{ message: string }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => ({ data, errors }),
    })
  );
}

describe("lib/plain", () => {
  beforeEach(() => {
    process.env.PLAIN_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("upsertTenant returns the tenant id on success", async () => {
    mockFetchOnce({ upsertTenant: { tenant: { id: "tenant_1" }, error: null } });
    const result = await upsertTenant({ externalId: "acme", name: "Acme Inc" });
    expect(result).toEqual({ tenantId: "tenant_1" });
  });

  it("upsertCustomer sends the email identifier and tenant link, then confirms it via addCustomerToTenants", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ data: { upsertCustomer: { customer: { id: "cust_1" }, error: null } } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: { addCustomerToTenants: { error: null } } }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await upsertCustomer({
      email: "jane@example.com",
      fullName: "Jane Doe",
      tenantExternalId: "acme",
    });
    expect(result).toEqual({ customerId: "cust_1" });

    const firstCallBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(firstCallBody.variables.input.identifier).toEqual({ emailAddress: "jane@example.com" });
    expect(firstCallBody.variables.input.onCreate.tenantIdentifiers).toEqual([{ externalId: "acme" }]);

    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(secondCallBody.variables.input).toEqual({
      customerIdentifier: { customerId: "cust_1" },
      tenantIdentifiers: [{ externalId: "acme" }],
    });
  });

  it("upsertCustomer does not call addCustomerToTenants when no tenant is given", async () => {
    mockFetchOnce({ upsertCustomer: { customer: { id: "cust_1" }, error: null } });
    await upsertCustomer({ email: "jane@example.com", fullName: "Jane Doe" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("createThread throws a PlainApiError when the API returns an error", async () => {
    mockFetchOnce({
      createThread: { thread: null, error: { message: "Customer not found", code: "NOT_FOUND" } },
    });
    await expect(
      createThread({
        customerId: "cust_1",
        title: "Bug",
        description: "Something broke",
        priority: 1,
        threadFields: [],
      })
    ).rejects.toThrow(PlainApiError);
  });

  it("createThread returns the thread id and ref on success", async () => {
    mockFetchOnce({ createThread: { thread: { id: "th_1", ref: "T-1" }, error: null } });
    const result = await createThread({
      customerId: "cust_1",
      title: "Bug",
      description: "Something broke",
      priority: 1,
      threadFields: [{ key: "product_area", type: "STRING", stringValue: "api" }],
    });
    expect(result).toEqual({ threadId: "th_1", ref: "T-1" });
  });

  it("upsertThreadField throws when the API returns an error", async () => {
    mockFetchOnce({ upsertThreadField: { error: { message: "Unknown field key", code: "INVALID" } } });
    await expect(
      upsertThreadField({ threadId: "th_1", key: "unknown", type: "STRING", stringValue: "x" })
    ).rejects.toThrow(PlainApiError);
  });

  it("markThreadAsDone resolves without error on success", async () => {
    mockFetchOnce({ markThreadAsDone: { error: null } });
    await expect(markThreadAsDone("th_1")).resolves.toBeUndefined();
  });

  it("getThread returns null when the thread does not exist", async () => {
    mockFetchOnce({ thread: null });
    const result = await getThread("th_missing");
    expect(result).toBeNull();
  });

  it("getThread returns thread fields when found", async () => {
    mockFetchOnce({
      thread: {
        id: "th_1",
        status: "TODO",
        threadFields: [{ key: "github_issue_number", stringValue: null, numberValue: 42 }],
      },
    });
    const result = await getThread("th_1");
    expect(result?.threadFields).toEqual([{ key: "github_issue_number", stringValue: null, numberValue: 42 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/plain.test.ts`
Expected: FAIL with "Cannot find module '../plain'"

- [ ] **Step 3: Write `lib/plainClient.ts`**

```ts
// lib/plainClient.ts
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
```

- [ ] **Step 4: Write `lib/plain.ts`**

```ts
// lib/plain.ts
import { plainRequest, PlainApiError } from "./plainClient";

export type ThreadFieldType = "STRING" | "NUMBER" | "BOOL";

export interface ThreadFieldInput {
  key: string;
  type: ThreadFieldType;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
}

export interface UpsertTenantParams {
  externalId: string;
  name: string;
}

export async function upsertTenant(params: UpsertTenantParams): Promise<{ tenantId: string }> {
  const query = `
    mutation UpsertTenant($input: UpsertTenantInput!) {
      upsertTenant(input: $input) {
        tenant { id }
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    upsertTenant: { tenant: { id: string } | null; error: { message: string; code: string } | null };
  }>(query, {
    input: {
      identifier: { externalId: params.externalId },
      name: params.name,
      externalId: params.externalId,
    },
  });

  if (data.upsertTenant.error || !data.upsertTenant.tenant) {
    throw new PlainApiError(data.upsertTenant.error?.message ?? "Failed to upsert tenant");
  }

  return { tenantId: data.upsertTenant.tenant.id };
}

export interface UpsertCustomerParams {
  email: string;
  fullName: string;
  tenantExternalId?: string;
}

export async function upsertCustomer(params: UpsertCustomerParams): Promise<{ customerId: string }> {
  const query = `
    mutation UpsertCustomer($input: UpsertCustomerInput!) {
      upsertCustomer(input: $input) {
        customer { id }
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    upsertCustomer: { customer: { id: string } | null; error: { message: string; code: string } | null };
  }>(query, {
    input: {
      identifier: { emailAddress: params.email },
      onCreate: {
        fullName: params.fullName,
        email: { email: params.email, isVerified: false },
        tenantIdentifiers: params.tenantExternalId ? [{ externalId: params.tenantExternalId }] : undefined,
      },
      onUpdate: {},
    },
  });

  if (data.upsertCustomer.error || !data.upsertCustomer.customer) {
    throw new PlainApiError(data.upsertCustomer.error?.message ?? "Failed to upsert customer");
  }

  const customerId = data.upsertCustomer.customer.id;

  if (params.tenantExternalId) {
    await addCustomerToTenants({ customerId, tenantExternalId: params.tenantExternalId });
  }

  return { customerId };
}

async function addCustomerToTenants(params: { customerId: string; tenantExternalId: string }): Promise<void> {
  const query = `
    mutation AddCustomerToTenants($input: AddCustomerToTenantsInput!) {
      addCustomerToTenants(input: $input) {
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    addCustomerToTenants: { error: { message: string; code: string } | null };
  }>(query, {
    input: {
      customerIdentifier: { customerId: params.customerId },
      tenantIdentifiers: [{ externalId: params.tenantExternalId }],
    },
  });

  if (data.addCustomerToTenants.error) {
    throw new PlainApiError(data.addCustomerToTenants.error.message);
  }
}

export interface CreateThreadParams {
  customerId: string;
  tenantExternalId?: string;
  title: string;
  description: string;
  priority: number;
  threadFields: ThreadFieldInput[];
}

export async function createThread(params: CreateThreadParams): Promise<{ threadId: string; ref: string }> {
  const query = `
    mutation CreateThread($input: CreateThreadInput!) {
      createThread(input: $input) {
        thread { id ref }
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    createThread: {
      thread: { id: string; ref: string } | null;
      error: { message: string; code: string } | null;
    };
  }>(query, {
    input: {
      customerIdentifier: { customerId: params.customerId },
      tenantIdentifier: params.tenantExternalId ? { externalId: params.tenantExternalId } : undefined,
      title: params.title,
      description: params.description,
      priority: params.priority,
      threadFields: params.threadFields,
    },
  });

  if (data.createThread.error || !data.createThread.thread) {
    throw new PlainApiError(data.createThread.error?.message ?? "Failed to create thread");
  }

  return { threadId: data.createThread.thread.id, ref: data.createThread.thread.ref };
}

export async function upsertThreadField(params: {
  threadId: string;
  key: string;
  type: ThreadFieldType;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
}): Promise<void> {
  const query = `
    mutation UpsertThreadField($input: UpsertThreadFieldInput!) {
      upsertThreadField(input: $input) {
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    upsertThreadField: { error: { message: string; code: string } | null };
  }>(query, {
    input: {
      identifier: { threadId: params.threadId, key: params.key },
      type: params.type,
      stringValue: params.stringValue,
      numberValue: params.numberValue,
      booleanValue: params.booleanValue,
    },
  });

  if (data.upsertThreadField.error) {
    throw new PlainApiError(data.upsertThreadField.error.message);
  }
}

export async function markThreadAsDone(threadId: string): Promise<void> {
  const query = `
    mutation MarkThreadAsDone($input: MarkThreadAsDoneInput!) {
      markThreadAsDone(input: $input) {
        error { message code }
      }
    }
  `;
  const data = await plainRequest<{
    markThreadAsDone: { error: { message: string; code: string } | null };
  }>(query, { input: { threadId } });

  if (data.markThreadAsDone.error) {
    throw new PlainApiError(data.markThreadAsDone.error.message);
  }
}

export async function getThread(threadId: string): Promise<{
  id: string;
  status: "TODO" | "SNOOZED" | "DONE";
  threadFields: Array<{ key: string; stringValue: string | null; numberValue: number | null }>;
} | null> {
  const query = `
    query GetThread($threadId: ID!) {
      thread(threadId: $threadId) {
        id
        status
        threadFields { key stringValue numberValue }
      }
    }
  `;
  const data = await plainRequest<{
    thread: {
      id: string;
      status: "TODO" | "SNOOZED" | "DONE";
      threadFields: Array<{ key: string; stringValue: string | null; numberValue: number | null }>;
    } | null;
  }>(query, { threadId });

  return data.thread;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/plain.test.ts`
Expected: `9 passed`

- [ ] **Step 6: Commit**

```bash
git add lib/plainClient.ts lib/plain.ts lib/__tests__/plain.test.ts
git commit -m "Add Plain GraphQL API client"
```

---

### Task 6: One-time Plain workspace setup script

**Files:**
- Create: `scripts/setup-plain-workspace.ts`

**Interfaces:**
- Consumes: `plainRequest` from `lib/plainClient.ts` (Task 5).
- Produces: five `ThreadFieldSchema` records in the target Plain workspace (`product_area`, `ticket_type`, `github_issue_number`, `github_issue_url`, `needs_github_issue`) that `createThread`/`upsertThreadField` write values against. This is a one-time operational script, not part of the running app — it is run once by the engineer against their real Plain workspace before the app can be used.

- [ ] **Step 1: Write the script**

```ts
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
```

- [ ] **Step 2: Run it against the real Plain workspace**

Set `PLAIN_API_KEY` in `.env.local` (needs `threadFieldSchema:create` and `threadFieldSchema:read` permissions) and run:

Run: `PLAIN_API_KEY=<your key> npm run setup:plain`
Expected: five lines of `Created thread field schema: <key>` (or `Schema already exists, skipping: <key>` on re-run).

Verify manually: in Plain, go to Settings → Thread fields and confirm all five fields are listed.

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-plain-workspace.ts
git commit -m "Add one-time script to create Plain thread field schemas"
```

---

### Task 7: GitHub API client

**Files:**
- Create: `lib/githubClient.ts`
- Create: `lib/github.ts`
- Test: `lib/__tests__/github.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `createIssue({ title, body, labels }): Promise<{ number: number; htmlUrl: string }>`, `getIssue(issueNumber: number): Promise<{ state: "open" | "closed"; body: string | null }>`, `closeIssue(issueNumber: number): Promise<void>` from `lib/github.ts`, and `GithubApiError` from `lib/githubClient.ts`. Consumed by Task 8 (orchestration route) and Task 11 (Plain webhook route).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/github.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createIssue, getIssue, closeIssue } from "../github";
import { GithubApiError } from "../githubClient";

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    })
  );
}

describe("lib/github", () => {
  beforeEach(() => {
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "acme/support";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createIssue posts to the configured repo and returns number/htmlUrl", async () => {
    mockFetchOnce(201, { number: 42, html_url: "https://github.com/acme/support/issues/42" });
    const result = await createIssue({ title: "Bug", body: "Details", labels: ["type:bug"] });
    expect(result).toEqual({ number: 42, htmlUrl: "https://github.com/acme/support/issues/42" });

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("https://api.github.com/repos/acme/support/issues");
    expect(JSON.parse(call[1]?.body as string)).toEqual({ title: "Bug", body: "Details", labels: ["type:bug"] });
  });

  it("getIssue returns the state and body", async () => {
    mockFetchOnce(200, { state: "open", body: "Details" });
    const result = await getIssue(42);
    expect(result).toEqual({ state: "open", body: "Details" });
  });

  it("closeIssue sends a PATCH with state closed", async () => {
    mockFetchOnce(200, { number: 42, state: "closed" });
    await closeIssue(42);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("https://api.github.com/repos/acme/support/issues/42");
    expect(call[1]?.method).toBe("PATCH");
    expect(JSON.parse(call[1]?.body as string)).toEqual({ state: "closed" });
  });

  it("throws GithubApiError on a non-2xx response", async () => {
    mockFetchOnce(404, { message: "Not Found" });
    await expect(getIssue(999)).rejects.toThrow(GithubApiError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/github.test.ts`
Expected: FAIL with "Cannot find module '../github'"

- [ ] **Step 3: Write `lib/githubClient.ts`**

```ts
// lib/githubClient.ts
const GITHUB_API_URL = "https://api.github.com";

export class GithubApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
  }
}

export async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GithubApiError("GITHUB_TOKEN is not set");
  }

  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new GithubApiError(`GitHub API error ${response.status}: ${body}`, response.status);
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 4: Write `lib/github.ts`**

```ts
// lib/github.ts
import { githubRequest } from "./githubClient";

function repoPath(): string {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    throw new Error("GITHUB_REPO is not set");
  }
  return `/repos/${repo}`;
}

export interface CreateIssueParams {
  title: string;
  body: string;
  labels: string[];
}

export async function createIssue(params: CreateIssueParams): Promise<{ number: number; htmlUrl: string }> {
  const issue = await githubRequest<{ number: number; html_url: string }>(`${repoPath()}/issues`, {
    method: "POST",
    body: JSON.stringify({ title: params.title, body: params.body, labels: params.labels }),
  });
  return { number: issue.number, htmlUrl: issue.html_url };
}

export async function getIssue(issueNumber: number): Promise<{ state: "open" | "closed"; body: string | null }> {
  const issue = await githubRequest<{ state: "open" | "closed"; body: string | null }>(
    `${repoPath()}/issues/${issueNumber}`
  );
  return { state: issue.state, body: issue.body };
}

export async function closeIssue(issueNumber: number): Promise<void> {
  await githubRequest(`${repoPath()}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/github.test.ts`
Expected: `4 passed`

- [ ] **Step 6: Commit**

```bash
git add lib/githubClient.ts lib/github.ts lib/__tests__/github.test.ts
git commit -m "Add GitHub REST API client"
```

---

### Task 8: Ticket orchestration endpoint

**Files:**
- Create: `app/api/tickets/route.ts`
- Test: `app/api/tickets/route.test.ts`

**Interfaces:**
- Consumes: `upsertTenant`, `upsertCustomer`, `createThread`, `upsertThreadField` from `@/lib/plain` (Task 5); `createIssue` from `@/lib/github` (Task 7); `buildGithubIssueBody` from `@/lib/ticketLink` (Task 4); `severityToPlainPriority`, `severityToGithubLabel`, `productAreaToGithubLabel`, `ticketTypeToGithubLabel`, `SEVERITIES`, `PRODUCT_AREAS`, `TICKET_TYPES` from `@/lib/taxonomy` (Task 2).
- Produces: `POST` handler at `/api/tickets` accepting `{ email, fullName, companyName?, title, description, productArea, severity, ticketType }` and returning `{ ticketRef: string; githubIssueUrl: string | null }` on success. Consumed by the form UI (Task 9).

- [ ] **Step 1: Write the failing test**

```ts
// app/api/tickets/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  upsertTenant: vi.fn(),
  upsertCustomer: vi.fn(),
  createThread: vi.fn(),
  upsertThreadField: vi.fn(),
}));
vi.mock("@/lib/github", () => ({
  createIssue: vi.fn(),
}));

import { upsertTenant, upsertCustomer, createThread, upsertThreadField } from "@/lib/plain";
import { createIssue } from "@/lib/github";
import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  email: "jane@example.com",
  fullName: "Jane Doe",
  title: "Login broken",
  description: "Cannot log in with SSO",
  productArea: "api",
  severity: "high",
  ticketType: "bug",
};

describe("POST /api/tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Plain thread and GitHub issue and links them", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockResolvedValue({ number: 42, htmlUrl: "https://github.com/acme/repo/issues/42" });

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ticketRef: "T-1", githubIssueUrl: "https://github.com/acme/repo/issues/42" });
    expect(upsertTenant).not.toHaveBeenCalled();
    expect(createThread).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cust_1", priority: 1 })
    );
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "th_1", key: "github_issue_number", numberValue: 42 })
    );
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: "th_1",
        key: "github_issue_url",
        stringValue: "https://github.com/acme/repo/issues/42",
      })
    );
  });

  it("upserts a tenant when a company name is provided", async () => {
    vi.mocked(upsertTenant).mockResolvedValue({ tenantId: "tenant_1" });
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockResolvedValue({ number: 1, htmlUrl: "https://github.com/acme/repo/issues/1" });

    await POST(makeRequest({ ...VALID_BODY, companyName: "Acme Inc" }));

    expect(upsertTenant).toHaveBeenCalledWith({ externalId: "acme-inc", name: "Acme Inc" });
    expect(upsertCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ tenantExternalId: "acme-inc" })
    );
  });

  it("returns 400 for a payload missing required fields", async () => {
    const response = await POST(makeRequest({ email: "jane@example.com" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid enum value", async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, severity: "banana" }));
    expect(response.status).toBe(400);
  });

  it("returns 502 and never creates a GitHub issue when Plain thread creation fails", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockRejectedValue(new Error("Plain API down"));

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(502);
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("tags the thread needs_github_issue when GitHub issue creation fails twice", async () => {
    vi.mocked(upsertCustomer).mockResolvedValue({ customerId: "cust_1" });
    vi.mocked(createThread).mockResolvedValue({ threadId: "th_1", ref: "T-1" });
    vi.mocked(createIssue).mockRejectedValue(new Error("GitHub API down"));

    const response = await POST(makeRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.githubIssueUrl).toBeNull();
    expect(createIssue).toHaveBeenCalledTimes(2);
    expect(upsertThreadField).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "th_1", key: "needs_github_issue", booleanValue: true })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/tickets/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Write the implementation**

```ts
// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { upsertTenant, upsertCustomer, createThread, upsertThreadField } from "@/lib/plain";
import { createIssue } from "@/lib/github";
import { buildGithubIssueBody } from "@/lib/ticketLink";
import {
  severityToPlainPriority,
  severityToGithubLabel,
  productAreaToGithubLabel,
  ticketTypeToGithubLabel,
  SEVERITIES,
  PRODUCT_AREAS,
  TICKET_TYPES,
  type Severity,
  type ProductArea,
  type TicketType,
} from "@/lib/taxonomy";

interface TicketRequestBody {
  email: string;
  fullName: string;
  companyName?: string;
  title: string;
  description: string;
  productArea: ProductArea;
  severity: Severity;
  ticketType: TicketType;
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function isValidTicketRequestBody(body: unknown): body is TicketRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === "string" &&
    typeof b.fullName === "string" &&
    typeof b.title === "string" &&
    typeof b.description === "string" &&
    typeof b.productArea === "string" &&
    (PRODUCT_AREAS as string[]).includes(b.productArea) &&
    typeof b.severity === "string" &&
    (SEVERITIES as string[]).includes(b.severity) &&
    typeof b.ticketType === "string" &&
    (TICKET_TYPES as string[]).includes(b.ticketType)
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!isValidTicketRequestBody(body)) {
    return NextResponse.json({ error: "Invalid ticket payload" }, { status: 400 });
  }

  let tenantExternalId: string | undefined;
  if (body.companyName) {
    tenantExternalId = slugify(body.companyName);
    await upsertTenant({ externalId: tenantExternalId, name: body.companyName });
  }

  let threadId: string;
  let threadRef: string;
  try {
    const customer = await upsertCustomer({
      email: body.email,
      fullName: body.fullName,
      tenantExternalId,
    });

    const thread = await createThread({
      customerId: customer.customerId,
      tenantExternalId,
      title: body.title,
      description: body.description,
      priority: severityToPlainPriority(body.severity),
      threadFields: [
        { key: "product_area", type: "STRING", stringValue: body.productArea },
        { key: "ticket_type", type: "STRING", stringValue: body.ticketType },
      ],
    });
    threadId = thread.threadId;
    threadRef = thread.ref;
  } catch (error) {
    console.error("Failed to create Plain thread", error);
    return NextResponse.json({ error: "Failed to submit ticket. Please try again." }, { status: 502 });
  }

  const issueBody = buildGithubIssueBody({
    description: body.description,
    plainThreadRef: threadRef,
    plainThreadId: threadId,
  });
  const labels = [
    severityToGithubLabel(body.severity),
    productAreaToGithubLabel(body.productArea),
    ticketTypeToGithubLabel(body.ticketType),
  ];

  let issueNumber: number | undefined;
  let issueUrl: string | undefined;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const issue = await createIssue({ title: body.title, body: issueBody, labels });
      issueNumber = issue.number;
      issueUrl = issue.htmlUrl;
      break;
    } catch (error) {
      console.error(`GitHub issue creation attempt ${attempt} failed`, error);
      if (attempt === maxAttempts) {
        await upsertThreadField({ threadId, key: "needs_github_issue", type: "BOOL", booleanValue: true });
      }
    }
  }

  if (issueNumber !== undefined && issueUrl !== undefined) {
    await upsertThreadField({ threadId, key: "github_issue_number", type: "NUMBER", numberValue: issueNumber });
    await upsertThreadField({ threadId, key: "github_issue_url", type: "STRING", stringValue: issueUrl });
  }

  return NextResponse.json({ ticketRef: threadRef, githubIssueUrl: issueUrl ?? null });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/tickets/route.test.ts`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add app/api/tickets/route.ts app/api/tickets/route.test.ts
git commit -m "Add ticket orchestration endpoint fanning out to Plain and GitHub"
```

---

### Task 9: Ticket form UI

**Files:**
- Create: `app/TicketForm.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `PRODUCT_AREAS`, `SEVERITIES`, `TICKET_TYPES` from `@/lib/taxonomy` (Task 2); calls `POST /api/tickets` (Task 8) via `fetch`.
- Produces: the customer-facing page at `/`. No further tasks depend on this one.

- [ ] **Step 1: Write `app/TicketForm.tsx`**

```tsx
// app/TicketForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { PRODUCT_AREAS, SEVERITIES, TICKET_TYPES } from "@/lib/taxonomy";

interface SubmitResult {
  ticketRef: string;
  githubIssueUrl: string | null;
}

export function TicketForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      companyName: formData.get("companyName") || undefined,
      title: formData.get("title"),
      description: formData.get("description"),
      productArea: formData.get("productArea"),
      severity: formData.get("severity"),
      ticketType: formData.get("ticketType"),
    };

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to submit ticket");
      }

      const json = (await response.json()) as SubmitResult;
      setResult(json);
      form.reset();
    } catch {
      setError("Something went wrong submitting your ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div role="status">
        <p>Thanks! Your ticket reference is {result.ticketRef}.</p>
        <button type="button" onClick={() => setResult(null)}>
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" name="email" required />
      </label>
      <label>
        Full name
        <input type="text" name="fullName" required />
      </label>
      <label>
        Company name
        <input type="text" name="companyName" />
      </label>
      <label>
        Title
        <input type="text" name="title" required />
      </label>
      <label>
        Description
        <textarea name="description" required />
      </label>
      <label>
        Product area
        <select name="productArea" required defaultValue="">
          <option value="" disabled>
            Select an area
          </option>
          {PRODUCT_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </label>
      <label>
        Severity
        <select name="severity" required defaultValue="">
          <option value="" disabled>
            Select severity
          </option>
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ticket type
        <select name="ticketType" required defaultValue="">
          <option value="" disabled>
            Select a type
          </option>
          {TICKET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit ticket"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
// app/page.tsx
import { TicketForm } from "./TicketForm";

export default function Home() {
  return (
    <main>
      <h1>Submit a support ticket</h1>
      <TicketForm />
    </main>
  );
}
```

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`
Open `http://localhost:3000`, fill out the form, and submit. Since `PLAIN_API_KEY`/`GITHUB_TOKEN` are likely not yet set to real values in local dev, expect the request to fail with the "Something went wrong" message — confirm that error state renders correctly. Full end-to-end verification (real Plain thread + GitHub issue) happens in Task 12's manual checklist once real credentials are configured.

- [ ] **Step 4: Commit**

```bash
git add app/TicketForm.tsx app/page.tsx
git commit -m "Add ticket submission form UI"
```

---

### Task 10: GitHub webhook handler (issue closed → Plain thread done)

**Files:**
- Create: `app/api/webhooks/github/route.ts`
- Test: `app/api/webhooks/github/route.test.ts`

**Interfaces:**
- Consumes: `verifyGithubSignature` from `@/lib/webhookSignatures` (Task 3); `parsePlainThreadId` from `@/lib/ticketLink` (Task 4); `getThread`, `markThreadAsDone` from `@/lib/plain` (Task 5).
- Produces: `POST` handler at `/api/webhooks/github`, to be registered as the repo's webhook target for the `issues` event.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/webhooks/github/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  getThread: vi.fn(),
  markThreadAsDone: vi.fn(),
}));

import { getThread, markThreadAsDone } from "@/lib/plain";
import { POST } from "./route";

const SECRET = "test-secret";

function sign(body: string): string {
  return "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
}

function makeRequest(body: string, signature: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/github", {
    method: "POST",
    headers: { "x-hub-signature-256": signature },
    body,
  });
}

describe("POST /api/webhooks/github", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_WEBHOOK_SECRET = SECRET;
  });

  it("rejects requests with an invalid signature", async () => {
    const body = JSON.stringify({ action: "closed", issue: { body: "" } });
    const response = await POST(makeRequest(body, "sha256=deadbeef"));
    expect(response.status).toBe(401);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("marks the linked Plain thread as done when the issue closes", async () => {
    const body = JSON.stringify({
      action: "closed",
      issue: { body: "<!-- plain-thread-id: th_123 -->" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_123", status: "TODO", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(markThreadAsDone).toHaveBeenCalledWith("th_123");
  });

  it("is a no-op when the thread is already done", async () => {
    const body = JSON.stringify({
      action: "closed",
      issue: { body: "<!-- plain-thread-id: th_123 -->" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_123", status: "DONE", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(markThreadAsDone).not.toHaveBeenCalled();
  });

  it("ignores events that are not issue closures", async () => {
    const body = JSON.stringify({ action: "opened", issue: { body: "" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("no-ops when the issue body has no linked Plain thread", async () => {
    const body = JSON.stringify({ action: "closed", issue: { body: "unrelated issue" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/webhooks/github/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Write the implementation**

```ts
// app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyGithubSignature } from "@/lib/webhookSignatures";
import { parsePlainThreadId } from "@/lib/ticketLink";
import { getThread, markThreadAsDone } from "@/lib/plain";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";

  if (!verifyGithubSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.action !== "closed") {
    return NextResponse.json({ ok: true });
  }

  const threadId = parsePlainThreadId(payload.issue?.body ?? null);
  if (!threadId) {
    console.log("GitHub issue closed with no linked Plain thread, skipping");
    return NextResponse.json({ ok: true });
  }

  const thread = await getThread(threadId);
  if (!thread) {
    console.log(`No Plain thread found for id ${threadId}, skipping`);
    return NextResponse.json({ ok: true });
  }

  if (thread.status === "DONE") {
    return NextResponse.json({ ok: true });
  }

  await markThreadAsDone(threadId);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/webhooks/github/route.test.ts`
Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/github/route.ts app/api/webhooks/github/route.test.ts
git commit -m "Add GitHub webhook handler to close the loop in Plain"
```

---

### Task 11: Plain webhook handler (thread done → GitHub issue closed)

**Files:**
- Create: `app/api/webhooks/plain/route.ts`
- Test: `app/api/webhooks/plain/route.test.ts`

**Interfaces:**
- Consumes: `verifyPlainSignature` from `@/lib/webhookSignatures` (Task 3); `getThread` from `@/lib/plain` (Task 5); `getIssue`, `closeIssue` from `@/lib/github` (Task 7).
- Produces: `POST` handler at `/api/webhooks/plain`, to be registered in Plain's Settings → Webhooks for the `thread.thread_status_transitioned` event.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/webhooks/plain/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/plain", () => ({
  getThread: vi.fn(),
}));
vi.mock("@/lib/github", () => ({
  getIssue: vi.fn(),
  closeIssue: vi.fn(),
}));

import { getThread } from "@/lib/plain";
import { getIssue, closeIssue } from "@/lib/github";
import { POST } from "./route";

const SECRET = "test-secret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

function makeRequest(body: string, signature: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/plain", {
    method: "POST",
    headers: { "plain-request-signature": signature },
    body,
  });
}

describe("POST /api/webhooks/plain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PLAIN_WEBHOOK_SECRET = SECRET;
  });

  it("rejects requests with an invalid signature", async () => {
    const body = JSON.stringify({ eventType: "thread.thread_status_transitioned", thread: { id: "th_1", status: "DONE" } });
    const response = await POST(makeRequest(body, "deadbeef"));
    expect(response.status).toBe(401);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("closes the linked GitHub issue when a thread transitions to done", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({
      id: "th_1",
      status: "DONE",
      threadFields: [{ key: "github_issue_number", stringValue: null, numberValue: 42 }],
    });
    vi.mocked(getIssue).mockResolvedValue({ state: "open", body: "..." });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(closeIssue).toHaveBeenCalledWith(42);
  });

  it("is a no-op when the GitHub issue is already closed", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({
      id: "th_1",
      status: "DONE",
      threadFields: [{ key: "github_issue_number", stringValue: null, numberValue: 42 }],
    });
    vi.mocked(getIssue).mockResolvedValue({ state: "closed", body: "..." });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(closeIssue).not.toHaveBeenCalled();
  });

  it("ignores transitions that are not to done", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "SNOOZED" },
    });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("ignores unrelated event types", async () => {
    const body = JSON.stringify({ eventType: "thread.thread_created", thread: { id: "th_1", status: "TODO" } });
    const response = await POST(makeRequest(body, sign(body)));
    expect(response.status).toBe(200);
    expect(getThread).not.toHaveBeenCalled();
  });

  it("no-ops when the thread has no linked GitHub issue", async () => {
    const body = JSON.stringify({
      eventType: "thread.thread_status_transitioned",
      thread: { id: "th_1", status: "DONE" },
    });
    vi.mocked(getThread).mockResolvedValue({ id: "th_1", status: "DONE", threadFields: [] });

    const response = await POST(makeRequest(body, sign(body)));

    expect(response.status).toBe(200);
    expect(getIssue).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/webhooks/plain/route.test.ts`
Expected: FAIL with "Cannot find module './route'"

- [ ] **Step 3: Write the implementation**

```ts
// app/api/webhooks/plain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPlainSignature } from "@/lib/webhookSignatures";
import { getThread } from "@/lib/plain";
import { getIssue, closeIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("plain-request-signature");
  const secret = process.env.PLAIN_WEBHOOK_SECRET ?? "";

  if (!verifyPlainSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.eventType !== "thread.thread_status_transitioned") {
    return NextResponse.json({ ok: true });
  }

  if (payload.thread?.status !== "DONE") {
    return NextResponse.json({ ok: true });
  }

  const threadId: string = payload.thread.id;
  const thread = await getThread(threadId);
  const issueNumberField = thread?.threadFields.find((field) => field.key === "github_issue_number");

  if (!issueNumberField || issueNumberField.numberValue === null) {
    console.log(`No linked GitHub issue for thread ${threadId}, skipping`);
    return NextResponse.json({ ok: true });
  }

  const issueNumber = issueNumberField.numberValue;
  const issue = await getIssue(issueNumber);

  if (issue.state === "closed") {
    return NextResponse.json({ ok: true });
  }

  await closeIssue(issueNumber);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/webhooks/plain/route.test.ts`
Expected: `6 passed`

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/plain/route.ts app/api/webhooks/plain/route.test.ts
git commit -m "Add Plain webhook handler to close the loop in GitHub"
```

---

### Task 12: Setup docs and end-to-end verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: setup instructions for the next engineer/operator; no code interface.

- [ ] **Step 1: Write `README.md`**

```markdown
# Support Ticket Portal

Customers submit a structured ticket once; it is created as both a Plain
thread (for support) and a GitHub issue (for engineering), cross-linked and
kept in sync when either side is closed. See
`docs/superpowers/specs/2026-07-07-support-ticket-portal-design.md` for the
full design.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `PLAIN_API_KEY` — needs `thread:create`, `thread:read`, `tenant:create`,
     `threadField:create`, `threadField:update`, `threadFieldSchema:create`,
     `threadFieldSchema:read` permissions.
   - `GITHUB_TOKEN` — a fine-grained PAT scoped to Issues read/write on the
     target repo.
   - `GITHUB_REPO` — `owner/repo` of the target repo.
   - `GITHUB_WEBHOOK_SECRET` — a secret you choose; used to verify inbound
     GitHub webhook requests.
   - `PLAIN_WEBHOOK_SECRET` — the HMAC secret configured on your Plain
     webhook target.
3. Run `npm run setup:plain` once to create the required Thread Field
   Schemas in your Plain workspace (`product_area`, `ticket_type`,
   `github_issue_number`, `github_issue_url`, `needs_github_issue`).
4. In GitHub, go to the target repo's Settings → Webhooks → Add webhook:
   - Payload URL: `https://<your-deployment>/api/webhooks/github`
   - Content type: `application/json`
   - Secret: same value as `GITHUB_WEBHOOK_SECRET`
   - Events: select "Issues" only.
5. In Plain, go to Settings → Webhooks → Add webhook target:
   - URL: `https://<your-deployment>/api/webhooks/plain`
   - Events: `thread.thread_status_transitioned`
   - Note the signing secret Plain gives you and set it as
     `PLAIN_WEBHOOK_SECRET`.

## Development

- `npm run dev` — start the local dev server.
- `npm test` — run the unit and integration test suite.
- `npm run build` — production build.

## Manual end-to-end verification

1. Submit a ticket through the form at `/`.
2. In Plain, confirm a new thread appears with the correct title, priority,
   and `product_area`/`ticket_type` thread field values.
3. In GitHub, confirm a new issue appears in the target repo with matching
   labels and a body containing the Plain ticket reference.
4. Close the GitHub issue. Confirm the Plain thread's status flips to Done.
5. Submit a second ticket, then mark its Plain thread as Done instead.
   Confirm the corresponding GitHub issue closes.
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all tests across every task pass (`lib/taxonomy`, `lib/webhookSignatures`, `lib/ticketLink`, `lib/plain`, `lib/github`, `app/api/tickets/route`, `app/api/webhooks/github/route`, `app/api/webhooks/plain/route`).

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build succeeds, listing `/`, `/api/tickets`, `/api/webhooks/github`, `/api/webhooks/plain` as routes.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Add setup instructions and manual verification checklist"
```
