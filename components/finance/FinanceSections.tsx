'use client';

import { useLocale } from '@/lib/locale';
import { EnquiryForm } from '@/components/forms/EnquiryForm';

export function TradeoffExplainer() {
  const { copy } = useLocale();

  return (
    <section className="section-mist">
      <div className="shell grid gap-8 py-16 xl:grid-cols-2 xl:gap-16 xl:py-20">
        <div>
          <h2 className="text-2xl font-extrabold md:text-3xl">{copy.finance.tradeoffHeading}</h2>
          <p className="mt-4 leading-relaxed text-[color:var(--ink-muted)]">{copy.finance.tradeoffBody}</p>
          <p className="mt-4 text-sm font-medium">{copy.finance.tradeoffExample}</p>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold md:text-3xl">{copy.finance.docsHeading}</h2>
          <p className="mt-3 text-[color:var(--ink-muted)]">{copy.finance.docsSub}</p>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule">
            {copy.finance.docs.map((doc) => (
              <li key={doc.title} className="bg-white p-4">
                <p className="font-semibold">{doc.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-muted)]">{doc.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function FinanceEnquiry() {
  const { copy } = useLocale();

  return (
    <section id="finance-enquiry" className="section-ink scroll-mt-20">
      <div className="shell grid gap-10 py-16 xl:grid-cols-2 xl:gap-16 xl:py-24">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold md:text-4xl">{copy.finance.formHeading}</h2>
          <p className="mt-4 text-[color:var(--on-ink-muted)]">{copy.finance.formSub}</p>
        </div>
        <EnquiryForm onInk variant="finance" kind="finance" />
      </div>
    </section>
  );
}
