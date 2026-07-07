import { TicketForm } from "./TicketForm";

export default function Home() {
  return (
    <main className="page">
      <div className="card">
        <div className="header">
          <h1>Submit a support ticket</h1>
          <p>Tell us what&apos;s going on and we&apos;ll get back to you as soon as possible.</p>
        </div>
        <TicketForm />
      </div>
    </main>
  );
}
