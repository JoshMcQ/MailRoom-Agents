import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-24">
        <section className="grid gap-6 text-center">
          <span className="mx-auto rounded-full border border-brand-light px-4 py-1 text-sm uppercase tracking-[0.2em] text-brand-light">
            Mailroom Agents
          </span>
          <h1 className="text-4xl font-medium leading-tight md:text-6xl">
            Turn every functional address into a policy-driven AI agent.
          </h1>
          <p className="text-lg text-slate-300 md:text-xl">
            Supersize support@, hello@, bugs@, and feedback@ with orchestrated AI workflows, guardrails, and cross-tool automations.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/app"
              className="rounded-md bg-brand px-6 py-3 text-slate-950 transition hover:bg-brand-light"
            >
              Launch Console
            </Link>
            <a
              href="#features"
              className="rounded-md border border-slate-700 px-6 py-3 text-slate-200 transition hover:border-brand hover:text-brand"
            >
              Explore Features
            </a>
          </div>
        </section>
        <section id="features" className="grid gap-10 md:grid-cols-2">
          {[
            {
              title: 'Policy-controlled agents',
              body: 'Define tone, guardrails, and routing per mailbox. Ship consistent responses at scale.'
            },
            {
              title: 'Embeddings-powered retrieval',
              body: 'Connect docs, tickets, and changelogs. Drafts cite the exact sources used.'
            },
            {
              title: 'Human-first approvals',
              body: 'Stay in control with granular approvals and audit trails across every action.'
            },
            {
              title: 'Connect the whole stack',
              body: 'From Gmail and Slack to GitHub, Notion, and Salesforce—Mailroom Agents orchestrate it all.'
            }
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold text-slate-50">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{feature.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
