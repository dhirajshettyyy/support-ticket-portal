// app/TicketForm.tsx
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  FABRIC_MODULES,
  PROJECTS,
  PRIORITIES,
  PRIORITY_LABELS,
  TICKET_TYPES,
  TICKET_TYPE_LABELS,
  DESCRIPTION_MAX_LENGTH,
} from "@/lib/taxonomy";

interface SubmitResult {
  ticketRef: string;
  githubIssueUrl: string | null;
}

export function TicketForm() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descriptionLength, setDescriptionLength] = useState(0);

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDescriptionLength(event.target.value.length);
  }

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
      fabricModule: formData.get("fabricModule"),
      project: formData.get("project"),
      priority: formData.get("priority"),
      ticketType: formData.get("ticketType"),
    };

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Failed to submit ticket");
      }

      setResult(json as SubmitResult);
      form.reset();
      setDescriptionLength(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong submitting your ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="success" role="status">
        <div className="success-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2>Ticket submitted</h2>
        <p>
          Thanks — your ticket reference is <span className="ticket-ref">{result.ticketRef}</span>. We&apos;ll follow
          up by email.
        </p>
        <button type="button" className="ghost-button" onClick={() => setResult(null)}>
          Submit another ticket
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" placeholder="you@company.com" required />
      </div>
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" type="text" name="fullName" placeholder="Jane Doe" required />
      </div>
      <div className="field">
        <label htmlFor="companyName">Company name</label>
        <input id="companyName" type="text" name="companyName" placeholder="Optional" />
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" type="text" name="title" placeholder="Short summary of the issue" required />
      </div>
      <div className="field">
        <div className="field-label-row">
          <label htmlFor="description">Description</label>
          <span className="char-count">
            {descriptionLength}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="description"
          name="description"
          placeholder="What happened? Steps to reproduce, what you expected, etc."
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={handleDescriptionChange}
          required
        />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor="fabricModule">Fabric Module</label>
          <select id="fabricModule" name="fabricModule" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {FABRIC_MODULES.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="project">Project</label>
          <select id="project" name="project" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {PROJECTS.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ticketType">Type</label>
          <select id="ticketType" name="ticketType" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {TICKET_TYPES.map((type) => (
              <option key={type} value={type}>
                {TICKET_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit ticket"}
      </button>
    </form>
  );
}
