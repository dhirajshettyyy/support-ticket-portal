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
