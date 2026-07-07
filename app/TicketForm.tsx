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
