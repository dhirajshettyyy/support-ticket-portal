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

  it("createThread includes field-level validation details in the thrown error message", async () => {
    mockFetchOnce({
      createThread: {
        thread: null,
        error: {
          message: "There was a validation error.",
          code: "VALIDATION",
          fields: [{ field: "title", message: "must not be blank", type: "REQUIRED" }],
        },
      },
    });
    await expect(
      createThread({
        customerId: "cust_1",
        title: "",
        description: "Something broke",
        priority: 1,
        threadFields: [],
      })
    ).rejects.toThrow("There was a validation error. (title: must not be blank)");
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
