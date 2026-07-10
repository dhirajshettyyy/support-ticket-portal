import { describe, it, expect } from "vitest";
import { formatMutationError } from "../plainClient";

describe("formatMutationError", () => {
  it("returns the fallback when there is no error", () => {
    expect(formatMutationError(null, "fallback")).toBe("fallback");
    expect(formatMutationError(undefined, "fallback")).toBe("fallback");
  });

  it("returns the bare message when there are no field errors", () => {
    expect(formatMutationError({ message: "Something broke", code: "UNKNOWN" }, "fallback")).toBe(
      "Something broke"
    );
  });

  it("returns the bare message when fields is an empty array", () => {
    expect(formatMutationError({ message: "Something broke", code: "UNKNOWN", fields: [] }, "fallback")).toBe(
      "Something broke"
    );
  });

  it("appends field-level details when present", () => {
    const result = formatMutationError(
      {
        message: "There was a validation error.",
        code: "VALIDATION",
        fields: [
          { field: "title", message: "must not be blank", type: "REQUIRED" },
          { field: "priority", message: "must be between 0 and 3", type: "INVALID" },
        ],
      },
      "fallback"
    );
    expect(result).toBe(
      "There was a validation error. (title: must not be blank; priority: must be between 0 and 3)"
    );
  });
});
