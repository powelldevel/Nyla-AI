import { Brand } from "@/components/layout/brand";
import { StatusPill } from "@/components/ui/status-pill";

const documentationUrl = "https://github.com/powelldevel/Nyla-AI/tree/main/docs";

export function PlanningStatusPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#17211b]">
      <header className="border-b border-[#dfe3dd] bg-[#fafbf8]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <Brand />
          <span className="rounded-full border border-[#d9ded8] bg-white px-3 py-1.5 text-xs font-medium text-[#4b5750]">
            P0-01 · Repository foundation
          </span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)] lg:gap-20">
          <section aria-labelledby="page-title" className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold tracking-[0.16em] text-[#356d52] uppercase">
              Evidence-first knowledge
            </p>
            <h1
              id="page-title"
              className="max-w-xl text-4xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance sm:text-5xl lg:text-[3.5rem]"
            >
              Trusted answers begin with a deliberate foundation.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#56615a]">
              Nyla is a secure organizational knowledge workspace designed to answer questions from
              approved documents with clear, verifiable citations.
            </p>
            <a
              className="mt-9 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1d5c42] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#174b37] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1d5c42]"
              href={documentationUrl}
            >
              Review the documentation
              <span aria-hidden="true">→</span>
            </a>
          </section>

          <section
            aria-labelledby="delivery-status-title"
            className="rounded-2xl border border-[#d9ded8] bg-[#fafbf8] p-6 shadow-[0_18px_50px_rgba(30,45,35,0.06)] sm:p-8"
          >
            <p className="text-xs font-semibold tracking-[0.14em] text-[#6a746d] uppercase">
              Delivery status
            </p>
            <h2
              id="delivery-status-title"
              className="mt-3 text-2xl font-semibold tracking-[-0.025em]"
            >
              Building with review gates
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#637068]">
              Product features remain intentionally unimplemented while the repository foundation is
              established and reviewed.
            </p>

            <ol className="mt-8 divide-y divide-[#e0e4df] border-y border-[#e0e4df]">
              <li className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">Planning</p>
                  <p className="mt-1 text-sm text-[#6a746d]">Product and system design package</p>
                </div>
                <StatusPill tone="complete">Planning complete</StatusPill>
              </li>
              <li className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">Engineering</p>
                  <p className="mt-1 text-sm text-[#6a746d]">Tooling, boundaries, tests, and CI</p>
                </div>
                <StatusPill tone="progress">Foundation in progress</StatusPill>
              </li>
            </ol>

            <p className="mt-6 text-xs leading-5 text-[#5f6a63]">
              No authentication, document processing, retrieval, or AI capabilities are active.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
